from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class MachineOut(BaseModel):
    id: int
    machine_id: str
    name: str
    location: Optional[str]
    motor_type: Optional[str]
    status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class SensorReadingIn(BaseModel):
    machine_id: str
    timestamp: datetime
    temperature: Optional[float]
    current: Optional[float]
    vibration_x: Optional[float]
    vibration_y: Optional[float]
    vibration_z: Optional[float]
    vibration_magnitude: Optional[float] = None


class SensorReadingOut(SensorReadingIn):
    id: int

    class Config:
        from_attributes = True


class AlertOut(BaseModel):
    id: int
    machine_id: str
    timestamp: Optional[datetime]
    severity: str
    type: str
    message: str
    suspected_cause: Optional[str]
    status: str

    class Config:
        from_attributes = True


class HealthStatusOut(BaseModel):
    machine_id: str
    health_score: float
    status: str
    anomaly_score: Optional[float]
    predicted_issue: Optional[str]
    last_updated: Optional[datetime]
