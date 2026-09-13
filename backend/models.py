from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class Machine(Base):
    __tablename__ = "machines"
    id           = Column(Integer, primary_key=True, index=True)
    machine_id   = Column(String, unique=True, index=True, nullable=False)
    name         = Column(String, nullable=False)
    location     = Column(String)
    motor_type   = Column(String)
    status       = Column(String, default="healthy")
    created_at   = Column(DateTime, server_default=func.now())


class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id                  = Column(Integer, primary_key=True, index=True)
    machine_id          = Column(String, index=True, nullable=False)
    timestamp           = Column(DateTime, nullable=False)
    temperature         = Column(Float)
    current             = Column(Float)       # Amps
    bus_voltage_v       = Column(Float)       # INA219 bus voltage
    power_mw            = Column(Float)       # INA219 power mW
    vibration_x         = Column(Float)
    vibration_y         = Column(Float)
    vibration_z         = Column(Float)
    vibration_magnitude = Column(Float)
    vibration_variance  = Column(Float)
    vibration_peak      = Column(Float)
    rpm                 = Column(Float)       # A3144E hall sensor
    mpu_ok              = Column(Integer, default=1)  # 0=MPU absent, 1=present
    edge_status         = Column(String)      # healthy/warning/critical from ESP32


class Alert(Base):
    __tablename__ = "alerts"
    id             = Column(Integer, primary_key=True, index=True)
    machine_id     = Column(String, index=True, nullable=False)
    timestamp      = Column(DateTime, server_default=func.now())
    severity       = Column(String)          # info | warning | critical
    type           = Column(String)
    message        = Column(Text)
    suspected_cause = Column(Text)
    status         = Column(String, default="open")  # open | acknowledged | resolved


class MlPrediction(Base):
    __tablename__ = "ml_predictions"
    id             = Column(Integer, primary_key=True, index=True)
    machine_id     = Column(String, index=True, nullable=False)
    timestamp      = Column(DateTime, server_default=func.now())
    model_version  = Column(String)
    anomaly_score  = Column(Float)
    health_score   = Column(Float)
    predicted_issue = Column(String)


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_history"
    id           = Column(Integer, primary_key=True, index=True)
    machine_id   = Column(String, index=True, nullable=False)
    date         = Column(DateTime)
    issue        = Column(Text)
    action_taken = Column(Text)
    technician   = Column(String)
    notes        = Column(Text)
