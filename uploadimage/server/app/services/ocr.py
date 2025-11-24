"""Thin OCR wrapper used as a fallback when Gemini struggles."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

try:  # pragma: no cover - optional dependency
    import pytesseract
    from PIL import Image
except Exception:  # pragma: no cover - when OCR libs missing
    pytesseract = None
    Image = None


class OCRService:
    def __init__(self) -> None:
        self._available = pytesseract is not None and Image is not None

    @property
    def available(self) -> bool:
        return self._available

    def read_text(self, *, file_path: Path) -> Optional[str]:
        if not self._available:
            return None
        try:
            with Image.open(file_path) as img:
                return pytesseract.image_to_string(img)
        except Exception:  # pragma: no cover - defensive
            return None
