from pydantic import BaseModel
from typing import List

class PPGSignal(BaseModel):
    signal: List[float]