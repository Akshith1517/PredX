# PredX Firmware v3.0 — Wiring & Setup Guide
## Actual Hardware Edition  |  12V 18000 RPM Conveyor

---

## 1. Complete Wiring Table

### BTS7960 IBT-2 H-Bridge Motor Driver
> The BTS7960 is a **dual half-bridge** — completely different from the L298N.
> It has two independent PWM inputs (RPWM = forward, LPWM = reverse) and
> two enable pins (R_EN, L_EN). Both enables must be HIGH to run.

| BTS7960 Pin | ESP32 Pin | Notes |
|------------|-----------|-------|
| RPWM       | GPIO 25   | Forward speed PWM (0–255 via analogWrite) |
| LPWM       | GPIO 26   | Reverse speed PWM — always 0 for conveyor |
| R_EN       | GPIO 27   | Set HIGH in setup() to enable right bridge |
| L_EN       | GPIO 14   | Set HIGH in setup() to enable left bridge |
| VCC        | 5V        | Logic supply for the IBT-2 board |
| GND        | GND       | Common ground with ESP32 |
| B+ / M+    | Motor +   | One motor terminal |
| B- / M-    | Motor −   | Other motor terminal |
| VMS / +12V | 12V rail  | 12V from SMPS adapter |
| GND (power)| GND rail  | Common GND |

> **Important:** NEVER set both RPWM and LPWM high simultaneously — that is a
> shoot-through condition and will destroy the BTS7960 immediately.

---

### INA219 Current/Voltage/Power Sensor
> The INA219 shunt resistor must be **in series with the motor current path**.
> Place it between the BTS7960 M+ output and the motor positive terminal.

| INA219 Pin | ESP32 Pin | Notes |
|-----------|-----------|-------|
| SDA       | GPIO 21   | Shared I2C bus |
| SCL       | GPIO 22   | Shared I2C bus |
| VCC       | 3.3V      | |
| GND       | GND       | |
| VIN+      | BTS7960 M+ output | Motor current in |
| VIN−      | Motor positive terminal | Motor current out |

> Default I2C address: **0x40** (A0=GND, A1=GND).
> The onboard shunt is 0.1Ω. At 2A that's 0.2V drop — acceptable.

---

### MPU6050 GY-521 (currently not working — troubleshooting steps below)

| MPU6050 Pin | ESP32 Pin | Notes |
|------------|-----------|-------|
| SDA        | GPIO 21   | Shared I2C bus |
| SCL        | GPIO 22   | Shared I2C bus |
| VCC        | 3.3V      | **NOT 5V** — will damage the chip |
| GND        | GND       | |
| AD0        | GND       | Keeps address at 0x68. Float or 3.3V = 0x69 |
| INT        | Not used  | Leave unconnected |

#### Why MPU6050 "not working" — checklist
1. **VCC = 3.3V** not 5V. The GY-521 module has a 3.3V regulator but the
   logic level shifter on some boards requires VCC = 3.3V directly.
2. **AD0 must be tied to GND** (not floating). Floating AD0 causes random
   address switching and `begin()` failure.
3. **Pull-ups:** The I2C lines need 4.7 kΩ pull-ups to 3.3V if not already
   on the module. The GY-521 has onboard 4.7 kΩ pull-ups — do not add more.
4. **Wire length:** Keep I2C wires under 30 cm. Long wires + motor EMI = lock-ups.
5. **Scan the bus:** Upload an I2C Scanner sketch to confirm you can see 0x40
   (INA219) and 0x68 (MPU6050). If only 0x40 appears, the MPU is the issue.
6. **The firmware tries 0x68 then 0x69 automatically.** Watch the Serial Monitor
   at 115200 baud for the result.

```cpp
// I2C Scanner sketch — paste into a new sketch and upload to check
#include <Wire.h>
void setup() {
  Serial.begin(115200);
  Wire.begin(21, 22);
  for (byte a = 1; a < 127; a++) {
    Wire.beginTransmission(a);
    if (Wire.endTransmission() == 0)
      Serial.printf("Found device at 0x%02X\n", a);
  }
}
void loop() {}
```

---

### DS18B20 Waterproof Temperature Probe

| DS18B20 Wire | ESP32 Pin | Notes |
|-------------|-----------|-------|
| Red   (VDD) | 3.3V      | |
| Black (GND) | GND       | |
| Yellow(DATA)| GPIO 4    | **Requires 4.7 kΩ pull-up resistor to 3.3V** |

> Tape or clamp the probe tip firmly against the motor body.
> Use a small amount of thermal paste between probe and motor for accuracy.

---

### A3144E Hall Effect RPM Sensor

| A3144E Pin | ESP32 Pin | Notes |
|-----------|-----------|-------|
| VCC       | 5V        | Module needs 5V |
| GND       | GND       | |
| OUT / SIG | GPIO 18   | INPUT_PULLUP. Triggers on FALLING edge. |

> Mount 2–3 mm from the shaft. Glue one neodymium magnet on the shaft
> or driven pulley. Set `MAGNETS_ON_SHAFT = 1` in firmware.
> Add a second magnet 180° apart and set `MAGNETS_ON_SHAFT = 2` for
> better low-speed resolution.

---

### Active Buzzer Module

| Buzzer Pin | ESP32 Pin | Notes |
|-----------|-----------|-------|
| +  / S    | GPIO 19   | HIGH = buzzes |
| −  / GND  | GND       | |

> Active buzzer (not passive) — just needs a digital HIGH to sound.
> No PWM frequency needed.

---

### Status LEDs (with 220 Ω series resistors)

| LED    | ESP32 Pin | Meaning |
|--------|-----------|---------|
| Green  | GPIO 32   | System healthy, normal operation |
| Yellow | GPIO 33   | Warning threshold crossed |
| Red    | GPIO 15   | Critical alert |

> Wiring: ESP32 pin → 220 Ω resistor → LED anode (+) → LED cathode (−) → GND

---

## 2. Power Architecture

```
230V AC Mains
      │
[12V 2A SMPS Wall Adapter]
      │
   12V rail ──────────────────────────────────┐
      │                                        │
      │                               [BTS7960 VMS]
      │                                        │
[LM2596 Buck Converter]              [BTS7960 Motor Output]
 (adjust to exactly 5.0V)                      │
      │                              [12V 18000RPM Motor]
    5V out
      │
   ┌──┴──────────────────────┐
   │  ESP32 VIN              │
   │  BTS7960 VCC (logic)    │
   │  A3144E VCC             │
   └─────────────────────────┘

3.3V (from ESP32 onboard regulator):
   → MPU6050 VCC
   → INA219 VCC
   → DS18B20 VDD
```

> The INA219's shunt goes between the BTS7960 M+ terminal and the motor +
> terminal so it measures actual motor current.

---

## 3. Key Differences: BTS7960 vs L298N

| Feature | L298N | BTS7960 IBT-2 |
|---------|-------|---------------|
| Max current | 2A continuous | **43A continuous** |
| Pins | ENA + IN1 + IN2 | RPWM + LPWM + R_EN + L_EN |
| Speed control | PWM on ENA | PWM directly on RPWM or LPWM |
| Direction | IN1/IN2 HIGH/LOW combos | RPWM = forward, LPWM = reverse |
| Logic supply | 5V from motor rail | Separate VCC pin (5V) |
| Heat at 12V 18000RPM | Gets very hot | Stays cool at normal loads |

---

## 4. Firmware Configuration Checklist

Before flashing, edit these lines in `predx_conveyor.ino`:

```cpp
const char* WIFI_SSID      = "YOUR_WIFI_SSID";      // your network name
const char* WIFI_PASSWORD  = "YOUR_WIFI_PASSWORD";  // your password
const char* MQTT_BROKER    = "192.168.1.100";        // run ipconfig on PC
const long  GMT_OFFSET_SEC = 19800;   // IST=19800, UTC=0, EST=-18000

// Motor speed — start low, increase slowly
const int MOTOR_SPEED_NORMAL = 70;   // percent. 12V 18000RPM is FAST.

// If you glued 2 magnets on the shaft:
const int MAGNETS_ON_SHAFT = 2;
```

---

## 5. First Power-On Sequence

1. Do **not** connect the motor yet. Power the ESP32 alone.
2. Open Serial Monitor at **115200 baud**.
3. Watch for `[OK]` lines for INA219, DS18B20, MPU6050, Hall sensor.
4. If MPU6050 shows `[WARN]` — run the I2C scanner sketch above.
5. Once all sensors show `[OK]`, power off.
6. Connect the motor to the BTS7960 outputs.
7. Power on. Confirm Serial Monitor shows `[READY]`.
8. The green LED should light and 2 beeps sound.

---

## 6. Fault Simulation for Demo

| Condition to simulate | How | What to watch |
|----------------------|-----|---------------|
| Belt overload | Press finger on belt | Current rises, RPM drops |
| Imbalance | Tape a coin to the pulley | Vibration magnitude spikes |
| Overheating | Wrap motor in foam for 1 min | Temperature rises |
| Belt slip | Loosen belt deliberately | RPM drops below threshold |
| Sensor dropout | Unplug DS18B20 | `temperature: -999` alert fires |
| MPU fault | Unplug MPU mid-run | `mpu_ok: false` in telemetry |
