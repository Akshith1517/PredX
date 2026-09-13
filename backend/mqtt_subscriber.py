"""
PredX MQTT Subscriber
──────────────────────────
Bridges live ESP32 telemetry into the SQLite database and runs
a rolling Isolation Forest anomaly scorer.

Run alongside the FastAPI server:
    python mqtt_subscriber.py

Or import start_subscriber() into main.py startup event.
"""
import json
import math
import os
import logging
from datetime import datetime
from collections import deque

import paho.mqtt.client as mqtt
from sqlalchemy.orm import Session

from database import SessionLocal
from models import SensorReading, Alert, MlPrediction

logging.basicConfig(level=logging.INFO, format="%(asctime)s [MQTT] %(message)s")
log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────
MQTT_BROKER  = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_PORT    = int(os.getenv("MQTT_BROKER_PORT", 1883))
MQTT_USER    = os.getenv("MQTT_USERNAME", "")
MQTT_PASS    = os.getenv("MQTT_PASSWORD", "")
TOPIC        = "factory/motor1/sensors"
ALERT_TOPIC  = "factory/motor1/alerts"

# ── Rolling window for anomaly detection ─────────────────────────
WINDOW_SIZE  = 50   # readings
_window: deque = deque(maxlen=WINDOW_SIZE)

# ── Simple Isolation Forest (scikit-learn) ────────────────────────
_model_ready = False
try:
    from sklearn.ensemble import IsolationForest
    import numpy as np
    _iso = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=42,
    )
    _model_ready = True
    log.info("Isolation Forest loaded — will score after %d readings", WINDOW_SIZE)
except ImportError:
    log.warning("scikit-learn not installed — anomaly scoring disabled. "
                "Run: pip install scikit-learn numpy")


def _build_feature_vector(r: dict) -> list:
    """Extract ML feature vector from a reading dict."""
    vx = r.get("vibration_x") or 0
    vy = r.get("vibration_y") or 0
    vz = r.get("vibration_z") or 0
    mag = r.get("vibration_magnitude") or (math.sqrt(vx**2 + vy**2 + vz**2) if vx else 0)
    cur = r.get("current_a") or (r.get("current_ma", 0) / 1000)
    return [
        r.get("temperature") or 0,
        cur,
        vx, vy, vz,
        mag,
        r.get("vibration_variance") or 0,
        r.get("rpm") or 0,
        r.get("bus_voltage_v") or 0,
        r.get("power_mw") or 0,
    ]


def _compute_health_score(anomaly_score: float) -> float:
    """Map Isolation Forest raw score (-1 worst .. +0.5 normal) → 0–100 health."""
    clamped = max(-0.5, min(0.5, anomaly_score))
    return round(20 + ((clamped + 0.5) / 1.0) * 80, 1)


def _score_anomaly(reading: dict) -> tuple[float, float, str]:
    """Return (anomaly_raw_score, health_score, predicted_issue)."""
    if not _model_ready:
        return 0.0, 87.0, "Unknown (scikit-learn not installed)"

    _window.append(_build_feature_vector(reading))

    if len(_window) < WINDOW_SIZE:
        return 0.0, 87.0, "Collecting baseline data"

    X = np.array(list(_window))
    _iso.fit(X)  # re-fit on latest window (online-style update)
    latest_vec = np.array([_build_feature_vector(reading)])
    raw_score  = float(_iso.score_samples(latest_vec)[0])
    decision   = _iso.predict(latest_vec)[0]  # 1=normal, -1=anomaly

    health = _compute_health_score(raw_score)

    if decision == -1:
        vib = reading.get("vibration_magnitude", 0) or 0
        cur = reading.get("current_a") or (reading.get("current_ma", 0) / 1000)
        tmp = reading.get("temperature", 0) or 0
        rpm = reading.get("rpm", 9999) or 9999

        if vib > 4.0:     issue = "Shaft Imbalance / Bearing Fault"
        elif cur > 3.5:   issue = "Belt Overload / Motor Overcurrent"
        elif tmp > 60:    issue = "Overheating"
        elif rpm < 100:   issue = "Belt Slip / Stall"
        else:             issue = "Unclassified Anomaly"
    else:
        issue = "Normal"

    return raw_score, health, issue


def _store_reading(db: Session, payload: dict) -> SensorReading:
    vx  = payload.get("vibration_x")
    vy  = payload.get("vibration_y")
    vz  = payload.get("vibration_z")
    mag = payload.get("vibration_magnitude")
    if mag is None and all(v is not None for v in [vx, vy, vz]):
        mag = round(math.sqrt(vx**2 + vy**2 + vz**2), 4)

    cur_a = payload.get("current_a")
    if cur_a is None:
        cur_a = (payload.get("current_ma") or 0) / 1000.0

    reading = SensorReading(
        machine_id=payload.get("machine_id", "motor_001"),
        timestamp=datetime.now(),  # Synchronized with local browser time
        temperature=payload.get("temperature"),
        current=cur_a,
        bus_voltage_v=payload.get("bus_voltage_v"),
        power_mw=payload.get("power_mw"),
        vibration_x=vx,
        vibration_y=vy,
        vibration_z=vz,
        vibration_magnitude=mag,
        vibration_variance=payload.get("vibration_variance"),
        vibration_peak=payload.get("vibration_peak"),
        rpm=payload.get("rpm"),
        mpu_ok=1 if payload.get("mpu_ok", True) else 0,
        edge_status=payload.get("edge_status"),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


def _store_prediction(db: Session, machine_id: str,
                       raw: float, health: float, issue: str):
    pred = MlPrediction(
        machine_id=machine_id,
        model_version="isolation_forest_v1",
        anomaly_score=round(-raw, 4),
        health_score=health,
        predicted_issue=issue,
    )
    db.add(pred)
    db.commit()


def _maybe_create_alert(db: Session, machine_id: str,
                         health: float, issue: str, raw: float):
    if health > 65 or issue == "Normal":
        return

    existing = db.query(Alert).filter(
        Alert.machine_id == machine_id,
        Alert.status == "open",
        Alert.type == "ML Anomaly",
    ).first()
    if existing:
        return

    severity = "critical" if health < 45 else "warning"
    alert = Alert(
        machine_id=machine_id,
        severity=severity,
        type="ML Anomaly",
        message=f"Isolation Forest detected anomaly (health {health:.1f}/100)",
        suspected_cause=issue,
        status="open",
    )
    db.add(alert)
    db.commit()
    log.warning("Alert created — %s | %s | health=%.1f", severity, issue, health)


# ── MQTT Callbacks ────────────────────────────────────────────────
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        log.info("Connected to broker %s:%d", MQTT_BROKER, MQTT_PORT)
        client.subscribe(TOPIC)
        client.subscribe(ALERT_TOPIC)
        log.info("Subscribed to %s and %s", TOPIC, ALERT_TOPIC)
    else:
        log.error("MQTT connection failed — rc=%d", rc)


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        machine_id = payload.get("machine_id", "motor_001")

        db = SessionLocal()
        try:
            if msg.topic == ALERT_TOPIC:
                alert = Alert(
                    machine_id=machine_id,
                    severity=payload.get("severity", "warning"),
                    type=payload.get("type", "Edge Alert"),
                    message=payload.get("message", ""),
                    suspected_cause=payload.get("suspected_cause", ""),
                    status="open",
                )
                db.add(alert)
                db.commit()
                log.info("Edge alert stored: %s", payload.get("type"))
                return

            _store_reading(db, payload)
            raw, health, issue = _score_anomaly(payload)
            _store_prediction(db, machine_id, raw, health, issue)
            _maybe_create_alert(db, machine_id, health, issue, raw)

            log.info("machine=%s | temp=%.1f°C | I=%.3fA | vib=%.3fg | "
                     "rpm=%d | health=%.1f | %s",
                     machine_id,
                     payload.get("temperature", 0),
                     payload.get("current_a") or (payload.get("current_ma", 0) / 1000),
                     payload.get("vibration_magnitude", 0),
                     int(payload.get("rpm", 0)),
                     health, issue)

        finally:
            db.close()

    except json.JSONDecodeError:
        log.warning("Non-JSON message on %s: %s", msg.topic, msg.payload[:80])
    except Exception as e:
        log.exception("Error processing message: %s", e)


def on_disconnect(client, userdata, rc):
    if rc != 0:
        log.warning("Unexpected MQTT disconnect — rc=%d (will auto-reconnect)", rc)


# ── Start subscriber ──────────────────────────────────────────────
def start_subscriber() -> mqtt.Client:
    # Uses Paho MQTT v2 CallbackAPIVersion to clear deprecation warning
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="predx_subscriber")
    except AttributeError:
        client = mqtt.Client(client_id="predx_subscriber")

    client.on_connect    = on_connect
    client.on_message    = on_message
    client.on_disconnect = on_disconnect

    if MQTT_USER:
        client.username_pw_set(MQTT_USER, MQTT_PASS)

    client.reconnect_delay_set(min_delay=1, max_delay=30)
    client.connect(MQTT_BROKER, MQTT_PORT, keepalive=60)
    client.loop_start()
    return client


if __name__ == "__main__":
    log.info("Starting PredX MQTT subscriber...")
    client = start_subscriber()
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        client.loop_stop()
        client.disconnect()
        log.info("Subscriber stopped.")