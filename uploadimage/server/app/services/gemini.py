"""Wrapper around the Gemini or OpenRouter-backed APIs."""

from __future__ import annotations

import base64
import io
import json
from typing import Any

import google.generativeai as genai
import google.generativeai.types as genai_types
import requests
from PIL import Image

from app.core.config import get_settings

PROMPT = (
    "You are an expert OCR post-processor. Given a receipt image, respond with a JSON object\n"
    "strictly following this schema: {\n"
    "  \"merchant_name\": string|null,\n"
    "  \"merchant_address\": string|null,\n"
    "  \"purchase_date\": string|null,\n"
    "  \"subtotal\": number|null,\n"
    "  \"tax\": number|null,\n"
    "  \"total\": number|null,\n"
    "  \"payment_method\": string|null,\n"
    "  \"currency\": string|null,\n"
    "  \"line_items\": [ {\n"
    "      \"description\": string,\n"
    "      \"quantity\": number|null,\n"
    "      \"unit_price\": number|null,\n"
    "      \"total\": number|null\n"
    "    } ],\n"
    "  \"additional_fields\": object (misc fields)\n"
    "}.\n"
    "Return only JSON with no prose."
)


class GeminiClient:
    def __init__(self) -> None:
        self._settings = get_settings()
        if not self._settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        self._provider = self._settings.llm_provider
        if self._provider == "google":
            genai.configure(api_key=self._settings.gemini_api_key)
            self._model = genai.GenerativeModel(self._settings.gemini_model)
        elif self._provider == "openrouter":
            self._model = None
        else:  # pragma: no cover - invalid configuration
            raise RuntimeError(f"Unsupported LLM provider: {self._provider}")

    def analyze(self, *, image_bytes: bytes, mime_type: str) -> tuple[str, dict[str, Any]]:
        """Send image to selected provider and parse response as JSON."""

        if self._provider == "google":
            text = self._google_call(image_bytes=image_bytes, mime_type=mime_type)
        else:
            text = self._openrouter_call(image_bytes=image_bytes, mime_type=mime_type)

        cleaned = self._strip_code_fences(text)
        try:
            return cleaned, json.loads(cleaned)
        except json.JSONDecodeError as exc:  # pragma: no cover - defensive logging
            raise RuntimeError("Gemini response is not valid JSON") from exc

    def _google_call(self, *, image_bytes: bytes, mime_type: str) -> str:
        # Convert bytes to PIL Image
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as exc:
            raise RuntimeError(f"Failed to open image: {exc}") from exc
        
        # Configure safety settings - use dict format for compatibility
        # The SDK accepts both dict and SafetySetting objects
        safety_settings = [
            {
                "category": genai_types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                "threshold": genai_types.HarmBlockThreshold.BLOCK_NONE,
            },
            {
                "category": genai_types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                "threshold": genai_types.HarmBlockThreshold.BLOCK_NONE,
            },
        ]
        
        # Generate content with image and prompt
        try:
            result = self._model.generate_content(
                [PROMPT, image],
                safety_settings=safety_settings,
            )
        except Exception as exc:
            error_msg = str(exc)
            # Check for quota errors and provide helpful message
            if "429" in error_msg or "quota" in error_msg.lower() or "Quota exceeded" in error_msg:
                raise RuntimeError(
                    f"Quota exceeded for model {self._settings.gemini_model}. "
                    f"The app will try to use OCR fallback parsing. To fix: (1) Wait ~36 seconds for quota reset, "
                    f"(2) Try a different model in .env (gemini-2.0-flash, gemini-2.5-flash, gemini-2.5-flash-image), "
                    f"or (3) Upgrade your Google AI Studio plan. Error: {error_msg[:150]}"
                ) from exc
            raise RuntimeError(f"Gemini API call failed: {exc}") from exc
        
        text = getattr(result, "text", None)
        if not text:
            # Check for blocked content or other issues
            if hasattr(result, "prompt_feedback"):
                feedback = result.prompt_feedback
                if feedback and hasattr(feedback, "block_reason"):
                    raise RuntimeError(f"Content was blocked: {feedback.block_reason}")
            raise RuntimeError("Gemini did not return any text")
        return text

    def _openrouter_call(self, *, image_bytes: bytes, mime_type: str) -> str:
        api_base = self._settings.openrouter_api_base.rstrip("/")
        data_url = self._build_data_url(image_bytes=image_bytes, mime_type=mime_type)
        payload = {
            "model": self._settings.gemini_model,
            "messages": [
                {"role": "system", "content": [{"type": "text", "text": PROMPT}]},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Here is the receipt image. Extract structured data."},
                        {"type": "input_image", "image_url": data_url},
                    ],
                },
            ],
        }
        headers = {
            "Authorization": f"Bearer {self._settings.gemini_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": self._settings.client_app_url or "http://localhost",
            "X-Title": self._settings.client_app_title,
        }
        try:
            response = requests.post(
                f"{api_base}/chat/completions",
                headers=headers,
                json=payload,
                timeout=self._settings.request_timeout_seconds,
            )
            response.raise_for_status()
        except requests.RequestException as exc:  # pragma: no cover - network failure
            raise RuntimeError(f"OpenRouter request failed: {exc}") from exc

        data = response.json()
        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError) as exc:  # pragma: no cover - defensive
            raise RuntimeError("OpenRouter response missing message content") from exc

        text_parts: list[str] = []
        if isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    text_parts.append(part.get("text", ""))
                elif isinstance(part, str):
                    text_parts.append(part)
        elif isinstance(content, str):
            text_parts.append(content)

        text = "\n".join(segment.strip() for segment in text_parts if segment).strip()
        if not text:
            raise RuntimeError("OpenRouter did not return any text content")
        return text

    @staticmethod
    def _build_data_url(*, image_bytes: bytes, mime_type: str) -> str:
        encoded = base64.b64encode(image_bytes).decode("ascii")
        return f"data:{mime_type};base64,{encoded}"

    @staticmethod
    def _strip_code_fences(text: str) -> str:
        trimmed = text.strip()
        if trimmed.startswith("```"):
            first_newline = trimmed.find("\n")
            if first_newline != -1:
                trimmed = trimmed[first_newline + 1 :]
            trimmed = trimmed.rstrip("`")
            if trimmed.endswith("```"):
                trimmed = trimmed[: -3]
        return trimmed.strip()
