from __future__ import annotations

import tempfile
from pathlib import Path
from typing import Optional

from fastapi import UploadFile

from app.core.config import get_settings
from app.schemas.analyze import AnalyzeResponse, ReceiptData
from app.services.gemini import GeminiClient
from app.services.ocr import OCRService
from app.services.ocr_parser import parse_receipt_from_ocr


def _coerce_receipt(payload: dict) -> ReceiptData:
    return ReceiptData(**payload)


class ReceiptAnalyzer:
    def __init__(self) -> None:
        self._settings = get_settings()
        self._gemini = GeminiClient()
        self._ocr = OCRService()

    async def process(self, file: UploadFile) -> AnalyzeResponse:
        contents = await file.read()
        warnings: list[str] = []

        raw_text: Optional[str] = None
        receipt: Optional[ReceiptData] = None
        gemini_failed = False
        
        # Try Gemini first
        try:
            raw_text, parsed = self._gemini.analyze(
                image_bytes=contents, mime_type=file.content_type or "application/octet-stream"
            )
            receipt = _coerce_receipt(parsed)
        except Exception as exc:  # pragma: no cover - runtime safety
            gemini_failed = True
            error_msg = str(exc)
            warnings.append(f"Gemini analysis failed: {error_msg[:200]}")

        # Always try OCR as fallback, especially if Gemini failed
        ocr_text: Optional[str] = None
        if self._settings.enable_ocr_fallback and self._ocr.available:
            with tempfile.NamedTemporaryFile(delete=False) as tmp:
                tmp.write(contents)
                tmp_path = Path(tmp.name)
            try:
                ocr_text = self._ocr.read_text(file_path=tmp_path)
                
                # If Gemini failed and we have OCR text, try to parse it
                if gemini_failed and ocr_text and not receipt:
                    try:
                        receipt = parse_receipt_from_ocr(ocr_text)
                        if receipt.merchant_name or receipt.total:
                            warnings.append("Using OCR-based parsing as Gemini quota was exceeded.")
                    except Exception as parse_exc:
                        warnings.append(f"OCR parsing failed: {str(parse_exc)[:100]}")
            finally:
                tmp_path.unlink(missing_ok=True)
        elif self._settings.enable_ocr_fallback:
            warnings.append("OCR fallback requested but pytesseract/Pillow not installed.")

        return AnalyzeResponse(parsed=receipt, raw_text=raw_text, ocr_text=ocr_text, warnings=warnings)
