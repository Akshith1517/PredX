"""
PredX FastAPI Backend
Endpoints match the initial API contract from the project spec.
"""
import math
import random
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, Machine, SensorReading, Alert, MlPrediction
from schemas import (
    MachineOut, SensorReadingIn, SensorReadingOut,
    AlertOut, HealthStatusOut,
)

# ── Create tables on startup ──────────────────────────────────────
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PredX — Predictive Maintenance API",
    version="1.0.0",
    description="Backend for the IoT Predictive Maintenance system.",
)

# ── CORS — allow the Vite dev server ─────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173",
                   "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ════════════════════════════════════════════════════════════════
# Root
# ════════════════════════════════════════════════════════════════
@app.get("/", tags=["Root"])
def root():
    return {
        "service": "PredX Predictive Maintenance API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
    }


# ════════════════════════════════════════════════════════════════
# Machines
# ════════════════════════════════════════════════════════════════
@app.get("/machines", response_model=List[MachineOut], tags=["Machines"])
def list_machines(db: Session = Depends(get_db)):
    """List all monitored machines."""
    return db.query(Machine).all()


@app.get("/machines/{machine_id}", response_model=MachineOut, tags=["Machines"])
def get_machine(machine_id: str, db: Session = Depends(get_db)):
    """Retrieve a single machine by machine_id."""
    m = db.query(Machine).filter(Machine.machine_id == machine_id).first()
    if not m:
        raise HTTPException(status_code=404, detail=f"Machine '{machine_id}' not found.")
    return m


# ════════════════════════════════════════════════════════════════
# Sensor Data
# ════════════════════════════════════════════════════════════════
@app.get("/sensor-data", response_model=List[SensorReadingOut], tags=["Sensors"])
def get_sensor_data(
    machine_id: Optional[str] = Query(None, description="Filter by machine_id"),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Return recent sensor readings, newest first."""
    q = db.query(SensorReading)
    if machine_id:
        q = q.filter(SensorReading.machine_id == machine_id)
    return q.order_by(SensorReading.timestamp.desc()).limit(limit).all()


@app.post("/sensor-data", response_model=SensorReadingOut, tags=["Sensors"])
def ingest_reading(payload: SensorReadingIn, db: Session = Depends(get_db)):
    """Ingest a single telemetry reading (simulates MQTT subscriber push)."""
    if payload.vibration_magnitude is None and all(
        v is not None for v in [payload.vibration_x, payload.vibration_y, payload.vibration_z]
    ):
        payload.vibration_magnitude = round(
            math.sqrt(payload.vibration_x**2 + payload.vibration_y**2 + payload.vibration_z**2), 4
        )
    reading = SensorReading(**payload.model_dump())
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@app.get("/sensor-data/live/{machine_id}", tags=["Sensors"])
def get_live_reading(machine_id: str, db: Session = Depends(get_db)):
    """Return the single most recent reading for a machine."""
    r = (
        db.query(SensorReading)
        .filter(SensorReading.machine_id == machine_id)
        .order_by(SensorReading.timestamp.desc())
        .first()
    )
    if not r:
        raise HTTPException(status_code=404, detail="No readings found.")
    return r


# ════════════════════════════════════════════════════════════════
# Alerts
# ════════════════════════════════════════════════════════════════
@app.get("/alerts", response_model=List[AlertOut], tags=["Alerts"])
def get_alerts(
    machine_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="open | acknowledged | resolved"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Return alerts, newest first."""
    q = db.query(Alert)
    if machine_id:
        q = q.filter(Alert.machine_id == machine_id)
    if status:
        q = q.filter(Alert.status == status)
    return q.order_by(Alert.timestamp.desc()).limit(limit).all()


@app.patch("/alerts/{alert_id}", response_model=AlertOut, tags=["Alerts"])
def update_alert_status(
    alert_id: int,
    status: str = Query(..., description="acknowledged | resolved"),
    db: Session = Depends(get_db),
):
    """Acknowledge or resolve an alert."""
    a = db.query(Alert).filter(Alert.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found.")
    if status not in ("acknowledged", "resolved"):
        raise HTTPException(status_code=400, detail="status must be 'acknowledged' or 'resolved'.")
    a.status = status
    db.commit()
    db.refresh(a)
    return a


# ════════════════════════════════════════════════════════════════
# Health Status
# ════════════════════════════════════════════════════════════════
@app.get("/health-status", response_model=List[HealthStatusOut], tags=["Health"])
def get_health_status(
    machine_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Return the latest ML health score per machine."""
    q = db.query(MlPrediction)
    if machine_id:
        q = q.filter(MlPrediction.machine_id == machine_id)

    # Latest prediction per machine
    results = []
    seen = set()
    for pred in q.order_by(MlPrediction.timestamp.desc()).all():
        if pred.machine_id not in seen:
            seen.add(pred.machine_id)
            score = pred.health_score or 87.0
            if score >= 80:   band = "healthy"
            elif score >= 60: band = "warning"
            elif score >= 40: band = "critical"
            else:             band = "failure"
            results.append(HealthStatusOut(
                machine_id=pred.machine_id,
                health_score=score,
                status=band,
                anomaly_score=pred.anomaly_score,
                predicted_issue=pred.predicted_issue,
                last_updated=pred.timestamp,
            ))
    return results


# ════════════════════════════════════════════════════════════════
# Simulated Live Telemetry  (GET /simulate — for demo / testing)
# ════════════════════════════════════════════════════════════════
@app.post("/simulate/{machine_id}", tags=["Demo"])
def simulate_reading(machine_id: str, anomaly: bool = False, db: Session = Depends(get_db)):
    """Generate and store one simulated sensor reading. Useful for demo without ESP32."""
    factor = 1.35 if anomaly else 1.0
    vx = round(0.12 * factor + random.uniform(-0.015, 0.015), 4)
    vy = round(0.09 * factor + random.uniform(-0.010, 0.010), 4)
    vz = round(1.44 * factor + random.uniform(-0.09,  0.09),  4)
    reading = SensorReading(
        machine_id=machine_id,
        timestamp=datetime.utcnow(),
        temperature=round(38 * factor + random.uniform(-2, 2), 2),
        current=round(2.1 * factor + random.uniform(-0.15, 0.15), 3),
        vibration_x=vx, vibration_y=vy, vibration_z=vz,
        vibration_magnitude=round(math.sqrt(vx**2 + vy**2 + vz**2), 4),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return {"status": "stored", "reading_id": reading.id, "anomaly": anomaly}
