/*
 * ================================================================
 *  PredX — IoT Predictive Maintenance Firmware (ESP32 Core v3)
 *  Target   : ESP32-WROOM-32
 * ================================================================
 */

#include <WiFi.h>
#include <time.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_INA219.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ════════════════════════════════════════════════════════════════
//  USER CONFIGURATION — Fill in your local WiFi & PC IP details
// ════════════════════════════════════════════════════════════════
const char* WIFI_SSID       = "Prakash 4g";
const char* WIFI_PASSWORD   = "Purvii@18";

// Run 'ipconfig' on your PC and enter its IPv4 address here
const char* MQTT_BROKER     = "192.168.29.84"; 
const int   MQTT_PORT       = 1883;
const char* MQTT_USER       = "";               
const char* MQTT_PASS       = "";
const char* MQTT_CLIENT_ID  = "predx_esp32_001";
const char* MQTT_TOPIC      = "factory/motor1/sensors";
const char* MQTT_ALERT_TOPIC= "factory/motor1/alerts";
const char* MQTT_STATUS_TOPIC= "factory/motor1/status";

const char* MACHINE_ID      = "motor_001";

// NTP Configuration (IST UTC+5:30)
const char* NTP_SERVER      = "pool.ntp.org";
const long  GMT_OFFSET_SEC  = 19800;  
const int   DST_OFFSET_SEC  = 0;

// Telemetry & Hardware Tuning
const unsigned long TELEMETRY_MS = 1000;  // Publish every 1 second
const int MAGNETS_ON_SHAFT       = 2;     // 2 opposite magnets verified
const int MOTOR_PWM_NORMAL       = 75;    // Safe startup PWM (~29%)
const int MOTOR_PWM_SLOW         = 40;    // Fallback safe speed on alert

// ════════════════════════════════════════════════════════════════
//  PIN DEFINITIONS
// ════════════════════════════════════════════════════════════════
#define PIN_BTS_RPWM   25
#define PIN_BTS_LPWM   26
#define PIN_BTS_R_EN   27
#define PIN_BTS_L_EN   14

#define PIN_ONE_WIRE   4
#define PIN_HALL       18

#define PIN_BUZZER     19
#define PIN_LED_GREEN  32
#define PIN_LED_YELLOW 33
#define PIN_LED_RED    15

#define MPU_ADDR       0x68

// PWM Parameters
#define PWM_FREQ       5000
#define PWM_RES        8

// Thresholds
const float TEMP_WARN_C    = 55.0f;
const float TEMP_CRIT_C    = 70.0f;
const float CURRENT_WARN_A = 1.2f;
const float CURRENT_CRIT_A = 2.5f;
const float VIB_MAG_WARN   = 3.5f;
const float VIB_MAG_CRIT   = 5.5f;
const int   RPM_MIN_WARN   = 150;

// ════════════════════════════════════════════════════════════════
//  GLOBAL OBJECTS & STATE
// ════════════════════════════════════════════════════════════════
Adafruit_INA219 ina219;
OneWire oneWire(PIN_ONE_WIRE);
DallasTemperature tempSensor(&oneWire);
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

volatile unsigned long hallPulses = 0;
volatile unsigned long lastInterruptMicros = 0;
unsigned long lastPulseSnapshot = 0;
unsigned long lastTelemetryMs = 0;
int activePWM = 0;
bool motorRunning = false;
bool mpuOk = false;
bool ntpSynced = false;
float lastValidTemp = 30.0f;

bool alertTemp = false;
bool alertCurrent = false;
bool alertVib = false;
bool alertRpm = false;

struct VibStats {
  float x, y, z;
  float magnitude;
  bool valid;
};

// Debounced Hall ISR
void IRAM_ATTR hallISR() {
  unsigned long now = micros();
  if (now - lastInterruptMicros > 3000) {
    hallPulses++;
    lastInterruptMicros = now;
  }
}

void beep(int count = 1, int onMs = 80, int offMs = 80) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delay(onMs);
    digitalWrite(PIN_BUZZER, LOW);
    if (i < count - 1) delay(offMs);
  }
}

void setStatusLEDs(const char* status) {
  digitalWrite(PIN_LED_GREEN,  LOW);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED,    LOW);

  if (strcmp(status, "healthy") == 0)      digitalWrite(PIN_LED_GREEN,  HIGH);
  else if (strcmp(status, "warning") == 0) digitalWrite(PIN_LED_YELLOW, HIGH);
  else if (strcmp(status, "critical") == 0)digitalWrite(PIN_LED_RED,    HIGH);
}

void stopMotor() {
  activePWM = 0;
  motorRunning = false;
  ledcWrite(PIN_BTS_RPWM, 0);
  ledcWrite(PIN_BTS_LPWM, 0);
}

void setMotorPWM(int target) {
  activePWM = constrain(target, 0, 255);
  ledcWrite(PIN_BTS_RPWM, activePWM);
  ledcWrite(PIN_BTS_LPWM, 0);
  motorRunning = (activePWM > 0);
}

void connectWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("\n[WiFi] Offline mode (telemetry will stream over Serial)");
  }
}

void syncNTP() {
  configTime(GMT_OFFSET_SEC, DST_OFFSET_SEC, NTP_SERVER);
  struct tm ti;
  int tries = 0;
  while (!getLocalTime(&ti) && tries < 10) { delay(400); tries++; }
  ntpSynced = (tries < 10);
  if (ntpSynced) Serial.println("[NTP] Real-time clock synchronized.");
}

void getISOTimestamp(char* buf, size_t len) {
  if (ntpSynced) {
    struct tm ti;
    if (getLocalTime(&ti)) {
      strftime(buf, len, "%Y-%m-%dT%H:%M:%SZ", &ti);
      return;
    }
  }
  // Fallback ISO timestamp starting from boot epoch
  snprintf(buf, len, "2026-09-10T12:00:%02luZ", (millis() / 1000) % 60);
}

void connectMQTT() {
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setBufferSize(768);

  if (!mqttClient.connected()) {
    Serial.print("[MQTT] Connecting to broker...");
    bool ok = (strlen(MQTT_USER) > 0)
      ? mqttClient.connect(MQTT_CLIENT_ID, MQTT_USER, MQTT_PASS)
      : mqttClient.connect(MQTT_CLIENT_ID);

    if (ok) {
      Serial.println(" Connected!");
      mqttClient.publish(MQTT_STATUS_TOPIC, "{\"event\":\"online\",\"machine_id\":\"motor_001\"}");
      beep(2, 60, 40);
    } else {
      Serial.printf(" Failed (state %d)\n", mqttClient.state());
    }
  }
}

void ensureMQTT() {
  if (WiFi.status() == WL_CONNECTED && !mqttClient.connected()) {
    static unsigned long lastMqttRetry = 0;
    if (millis() - lastMqttRetry > 5000) {
      connectMQTT();
      lastMqttRetry = millis();
    }
  }
  mqttClient.loop();
}

VibStats readVibrationDirect() {
  VibStats vs = {0, 0, 0, 0, false};
  if (!mpuOk) return vs;

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) == 0 && Wire.requestFrom(MPU_ADDR, 6, true) == 6) {
    int16_t rawX = (Wire.read() << 8) | Wire.read();
    int16_t rawY = (Wire.read() << 8) | Wire.read();
    int16_t rawZ = (Wire.read() << 8) | Wire.read();

    vs.x = (float)rawX / 16384.0f;
    vs.y = (float)rawY / 16384.0f;
    vs.z = (float)rawZ / 16384.0f;
    vs.magnitude = sqrtf(vs.x * vs.x + vs.y * vs.y + vs.z * vs.z);
    vs.valid = true;
  }
  return vs;
}

void publishAlert(const char* severity, const char* type, const char* message, const char* cause) {
  StaticJsonDocument<300> doc;
  char ts[32];
  getISOTimestamp(ts, sizeof(ts));

  doc["machine_id"]      = MACHINE_ID;
  doc["timestamp"]       = ts;
  doc["severity"]        = severity;
  doc["type"]            = type;
  doc["message"]         = message;
  doc["suspected_cause"] = cause;
  doc["status"]          = "active";

  char buf[300];
  serializeJson(doc, buf);
  if (mqttClient.connected()) {
    mqttClient.publish(MQTT_ALERT_TOPIC, buf);
  }
  Serial.printf("\n[ALERT - %s] %s (%s)\n", severity, message, cause);
}

void checkThresholds(float tempC, float currentA, const VibStats& vib, float rpm) {
  // Temperature
  if (tempC > TEMP_CRIT_C && !alertTemp) {
    publishAlert("critical", "Overtemperature", "Motor temperature critically high", "Thermal overload");
    beep(3, 120, 80);
    alertTemp = true;
  } else if (tempC > TEMP_WARN_C && !alertTemp) {
    publishAlert("warning", "Temperature Rise", "Motor temperature elevated", "Prolonged duty cycle");
    beep(1, 100);
    alertTemp = true;
  } else if (tempC < TEMP_WARN_C - 5.0f) {
    alertTemp = false;
  }

  // Current
  if (currentA > CURRENT_CRIT_A && !alertCurrent) {
    publishAlert("critical", "Overcurrent", "Motor current exceeded safety threshold", "Mechanical jam / stall");
    beep(3, 150, 80);
    alertCurrent = true;
  } else if (currentA > CURRENT_WARN_A && !alertCurrent) {
    publishAlert("warning", "High Current", "Motor current elevated", "Excess belt drag");
    beep(1, 60);
    alertCurrent = true;
  } else if (currentA < CURRENT_WARN_A * 0.75f) {
    alertCurrent = false;
  }

  // Vibration
  if (vib.valid) {
    if (vib.magnitude > VIB_MAG_CRIT && !alertVib) {
      publishAlert("critical", "Excessive Vibration", "Vibration magnitude critical", "Severe mechanical imbalance");
      beep(4, 80, 60);
      alertVib = true;
    } else if (vib.magnitude > VIB_MAG_WARN && !alertVib) {
      publishAlert("warning", "Vibration Warning", "Vibration elevated", "Mount loosened or shaft wobble");
      beep(1, 80);
      alertVib = true;
    } else if (vib.magnitude < VIB_MAG_WARN * 0.7f) {
      alertVib = false;
    }
  }

  // RPM
  if (motorRunning) {
    if (rpm < RPM_MIN_WARN && !alertRpm) {
      publishAlert("warning", "Low RPM", "Shaft speed below expectation", "Belt slip or motor stalling");
      beep(2, 100, 80);
      alertRpm = true;
    } else if (rpm > RPM_MIN_WARN * 2) {
      alertRpm = false;
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n================================================");
  Serial.println("      PredX IoT Firmware — Core v3 Compatible    ");
  Serial.println("================================================");

  pinMode(PIN_BTS_R_EN, OUTPUT);
  pinMode(PIN_BTS_L_EN, OUTPUT);
  digitalWrite(PIN_BTS_R_EN, HIGH);
  digitalWrite(PIN_BTS_L_EN, HIGH);

  ledcAttach(PIN_BTS_RPWM, PWM_FREQ, PWM_RES);
  ledcAttach(PIN_BTS_LPWM, PWM_FREQ, PWM_RES);
  stopMotor();

  pinMode(PIN_BUZZER,     OUTPUT);
  pinMode(PIN_LED_GREEN,  OUTPUT);
  pinMode(PIN_LED_YELLOW, OUTPUT);
  pinMode(PIN_LED_RED,    OUTPUT);

  digitalWrite(PIN_LED_GREEN, HIGH);
  digitalWrite(PIN_LED_YELLOW, HIGH);
  digitalWrite(PIN_LED_RED, HIGH);
  beep(1, 80);
  delay(300);
  digitalWrite(PIN_LED_GREEN, LOW);
  digitalWrite(PIN_LED_YELLOW, LOW);
  digitalWrite(PIN_LED_RED, LOW);

  pinMode(PIN_HALL, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_HALL), hallISR, FALLING);

  Wire.begin(21, 22);
  Wire.setTimeOut(50);
  ina219.begin();

  // Wake MPU6050
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B);
  Wire.write(0x00);
  mpuOk = (Wire.endTransmission() == 0);
  Serial.printf("[MPU6050] %s\n", mpuOk ? "Initialized (0x68)" : "Not Detected");

  tempSensor.begin();

  connectWiFi();
  if (WiFi.status() == WL_CONNECTED) {
    syncNTP();
    connectMQTT();
  }

  Serial.println("\nAll subsystems initialized. Starting in 5 seconds...");
  for (int i = 5; i > 0; i--) {
    Serial.printf("Motor start in %d...\n", i);
    delay(1000);
  }

  setMotorPWM(MOTOR_PWM_NORMAL);
  setStatusLEDs("healthy");
  beep(2, 60, 40);
  Serial.println("[READY] Telemetry streaming active.\n");
}

void loop() {
  ensureMQTT();

  unsigned long now = millis();
  if (now - lastTelemetryMs >= TELEMETRY_MS) {
    float intervalSec = (now - lastTelemetryMs) / 1000.0f;

    // 1. Hall RPM (2 magnets)
    noInterrupts();
    unsigned long currentPulses = hallPulses;
    hallPulses = 0;
    interrupts();
    float rpm = (((float)currentPulses / intervalSec) * 60.0f) / (float)MAGNETS_ON_SHAFT;

    // 2. INA219 (A & V)
    float busV = ina219.getBusVoltage_V();
    float currentMA = ina219.getCurrent_mA();
    if (currentMA < 0) currentMA = 0;
    float currentA = currentMA / 1000.0f;

    // 3. DS18B20 Temp
    tempSensor.requestTemperatures();
    float rawTemp = tempSensor.getTempCByIndex(0);
    if (rawTemp > -50.0f && rawTemp < 125.0f) {
      lastValidTemp = rawTemp;
    }

    // 4. MPU6050
    VibStats vib = readVibrationDirect();

    // 5. Edge Fault Check & Dynamic Speed Adjust
    checkThresholds(lastValidTemp, currentA, vib, rpm);
    if (alertCurrent || alertTemp) {
      setMotorPWM(MOTOR_PWM_SLOW);
    } else {
      setMotorPWM(MOTOR_PWM_NORMAL);
    }

    // 6. JSON Telemetry matching backend SensorReadingIn
    StaticJsonDocument<512> doc;
    char ts[32];
    getISOTimestamp(ts, sizeof(ts));

    doc["machine_id"]   = MACHINE_ID;
    doc["timestamp"]    = ts;
    doc["temperature"]  = lastValidTemp;
    doc["current"]      = currentA;

    if (vib.valid) {
      doc["vibration_x"]         = vib.x;
      doc["vibration_y"]         = vib.y;
      doc["vibration_z"]         = vib.z;
      doc["vibration_magnitude"] = vib.magnitude;
    } else {
      doc["vibration_x"]         = nullptr;
      doc["vibration_y"]         = nullptr;
      doc["vibration_z"]         = nullptr;
      doc["vibration_magnitude"] = nullptr;
    }

    char payload[512];
    size_t len = serializeJson(doc, payload);

    bool pubOk = false;
    if (mqttClient.connected()) {
      pubOk = mqttClient.publish(MQTT_TOPIC, (uint8_t*)payload, len, false);
    }

    const char* health = (alertTemp || alertCurrent || (vib.valid && alertVib)) ? "critical" :
                         (rpm < RPM_MIN_WARN) ? "warning" : "healthy";
    setStatusLEDs(health);

    // Serial Dashboard
    Serial.printf("[%s] V: %.2fV | I: %.3fA | RPM: %4.0f | Vib: %.2fg | Temp: %.1f°C | MQTT: %s\n",
                  ts, busV, currentA, rpm, vib.magnitude, lastValidTemp, pubOk ? "SENT" : "OFFLINE");

    lastTelemetryMs = now;
  }
}