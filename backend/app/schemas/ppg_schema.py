from pydantic import BaseModel, Field
from typing import List, Optional


class MeasurementContext(BaseModel):
    user_id: str = "default-user"
    session_type: str = Field(default="resting")
    activity_load: int = Field(default=0, ge=0, le=100)
    stress_level: int = Field(default=50, ge=0, le=100)

class PPGSignal(BaseModel):
    signal: List[float]
    sampling_rate: int = Field(default=100, gt=0)
    user_id: str = "default-user"
    session_type: str = Field(default="resting")
    activity_load: int = Field(default=0, ge=0, le=100)
    stress_level: int = Field(default=50, ge=0, le=100)


class SimulationInput(BaseModel):
    strategy: str
    user_id: str = "default-user"
    session_type: Optional[str] = None
    activity_load: int = 50
    stress_level: int = 50
