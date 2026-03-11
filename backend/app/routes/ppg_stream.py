from fastapi import APIRouter

router = APIRouter(prefix="/api")

buffer = []

@router.post("/stream")
def stream_ppg(data: dict):

    value = data.get("value")

    buffer.append(value)

    if len(buffer) > 500:
        buffer.pop(0)

    return {"buffer_size": len(buffer)}