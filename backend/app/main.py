from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import metrics


app = FastAPI(title="PPG Signal Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)