"""Seed the database with initial machine + demo readings."""
import math
import random
from datetime import datetime, timedelta
from database import engine, SessionLocal
from models import Base, Machine, SensorReading, Alert, MlPrediction, MaintenanceRecord

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── Machine ──────────────────────────────────────────────────────
existing = db.query(Machine).filter_by(machine_id="motor_001").first()
if not existing:
    db.add(Machine(
        machine_id="motor_001",
        name="Motor Unit 001",
        location="Production Floor A",
        motor_type="775 DC Motor — 24 V",
        status="healthy",
    ))
    db.commit()
    print("Seeded machine motor_001")

# ── Sensor readings (last 2 hours, 1-min interval) ────────────────
count = db.query(SensorReading).filter_by(machine_id="motor_001").count()
if count == 0:
    now = datetime.utcnow()
    for i in range(120):
        ts = now - timedelta(minutes=120 - i)
        vx = round(0.12 + random.uniform(-0.012, 0.012), 4)
        vy = round(0.09 + random.uniform(-0.009, 0.009), 4)
        vz = round(1.44 + random.uniform(-0.08, 0.08), 4)
        db.add(SensorReading(
            machine_id="motor_001",
            timestamp=ts,
            temperature=round(38 + random.uniform(-1.5, 1.5), 2),
            current=round(2.1 + random.uniform(-0.12, 0.12), 3),
            vibration_x=vx,
            vibration_y=vy,
            vibration_z=vz,
            vibration_magnitude=round(math.sqrt(vx**2 + vy**2 + vz**2), 4),
        ))
    db.commit()
    print("Seeded 120 sensor readings")

# ── Alerts ────────────────────────────────────────────────────────
if db.query(Alert).count() == 0:
    now = datetime.utcnow()
    for alert in [
        dict(machine_id="motor_001", timestamp=now - timedelta(minutes=14),
             severity="warning",  type="Vibration Spike",
             message="Z-axis vibration exceeded threshold (1.92 g)",
             suspected_cause="Possible shaft imbalance", status="open"),
        dict(machine_id="motor_001", timestamp=now - timedelta(minutes=52),
             severity="info",     type="Temperature Rise",
             message="Motor temperature increased by 8 °C over 15 min",
             suspected_cause="Increased load / ambient temperature", status="acknowledged"),
        dict(machine_id="motor_001", timestamp=now - timedelta(hours=3),
             severity="critical", type="Anomaly Detected",
             message="ML model flagged anomaly — score 0.73",
             suspected_cause="Bearing wear pattern detected", status="resolved"),
    ]:
        db.add(Alert(**alert))
    db.commit()
    print("Seeded alerts")

# ── ML predictions ────────────────────────────────────────────────
if db.query(MlPrediction).count() == 0:
    db.add(MlPrediction(
        machine_id="motor_001",
        model_version="v1.2.0",
        anomaly_score=0.11,
        health_score=87.0,
        predicted_issue="Normal",
    ))
    db.commit()
    print("Seeded ML prediction")

# ── Maintenance history ───────────────────────────────────────────
if db.query(MaintenanceRecord).count() == 0:
    db.add(MaintenanceRecord(
        machine_id="motor_001",
        date=datetime(2026, 7, 14),
        issue="Scheduled inspection",
        action_taken="Bearings checked, lubricated. No faults found.",
        technician="J. Smith",
        notes="Next inspection due in 60 days.",
    ))
    db.commit()
    print("Seeded maintenance record")

db.close()
print("Seed complete.")
