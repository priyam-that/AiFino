from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routes import analyze, samples

settings = get_settings()
app = FastAPI(title="Gemini Receipt Analyzer", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(analyze.router)
app.include_router(samples.router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
