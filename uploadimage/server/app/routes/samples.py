from __future__ import annotations

import mimetypes
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "samples"

router = APIRouter(prefix="/api", tags=["samples"])


@router.get("/samples")
def list_samples() -> list[dict[str, str]]:
    samples: list[dict[str, str]] = []
    for file_path in sorted(SAMPLES_DIR.glob("*")):
        if not file_path.is_file():
            continue
        mime, _ = mimetypes.guess_type(file_path.name)
        samples.append(
            {
                "id": file_path.name,
                "label": file_path.stem.replace("_", " ").title(),
                "mime_type": mime or "application/octet-stream",
            }
        )
    return samples


@router.get("/samples/{sample_id}")
def download_sample(sample_id: str) -> FileResponse:
    file_path = SAMPLES_DIR / sample_id
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Sample not found")
    mime, _ = mimetypes.guess_type(file_path.name)
    return FileResponse(path=file_path, media_type=mime, filename=file_path.name)
