
from pydantic import BaseModel, Field


class TankState(BaseModel):
    capacity_litres: float = Field(gt=0)
    current_litres: float = Field(ge=0)
    
    def model_post_init(self, __context):
        if self.current_litres > self.capacity_litres:
            raise ValueError("Water cannot exceed tank capacity")


class PumpState(BaseModel):
    status: str = "running"
    flow_rate_litres_per_hour: float = Field(default=500, ge=0)


class WaterReading(BaseModel):
    timestamp: str
    current_litres: float
    level_percent: float


class Alert(BaseModel):
    severity: str
    message: str
