# Gemini Receipt Analyzer

End-to-end demo that uploads receipt images, extracts structured data with Google Gemini, and offers a JSON/visual viewer with OCR fallback support.

## Prerequisites

- Python 3.12+
- `uv` for dependency management (https://github.com/astral-sh/uv)
- Node.js 18+
- Either a Google AI Studio API key (Gemini 2.5 Flash Image or newer) **or** an OpenRouter API key that exposes an image-capable Gemini model
- Optional: Tesseract + `pytesseract` binary if you enable OCR fallback locally

## Backend (FastAPI + Gemini)

1. Copy the environment template and add your key:
   ```bash
   cd server
   cp .env.example .env
   # edit GEMINI_API_KEY, optional: GEMINI_MODEL, LLM_PROVIDER, OPENROUTER_API_BASE, ENABLE_OCR_FALLBACK
   ```
2. Install Python requirements via `uv` (already vendorized in this repo):
   ```bash
   cd /home/priyam-manna/Coding/uploadimage
   uv pip install -r server/requirements.txt
   ```
3. Generate offline sample receipts (stores PNG/JPEG files under `server/samples/`):
   ```bash
   uv run python scripts/generate_samples.py
   ```
4. Launch the API:
   
   **If you're in the `server` directory:**
   ```bash
   uv run uvicorn app.main:app --reload
   ```
   
   **If you're in the parent `uploadimage` directory:**
   ```bash
   uv run uvicorn app.main:app --app-dir server --reload
   ```
   The API exposes:
   - `POST /api/analyze` – multipart upload invoking Gemini + OCR fallback
   - `GET /api/samples` and `GET /api/samples/{id}` – front-end sample picker
   - `GET /health`

## Frontend (Vite + React)

1. Install dependencies:
   ```bash
   cd client
   npm install
   cp .env.example .env # optional override for VITE_API_BASE_URL
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:5173` and drag/drop a file or pick a sample. Toggle between the Visual and JSON views, download the structured JSON, or inspect warnings/ OCR text.

## Project Layout

```
server/
  app/
    core/        # settings and configuration
    routes/      # FastAPI routers (analysis + samples)
    schemas/     # Pydantic response models
    services/    # Gemini + OCR wrappers
  samples/       # Auto-generated demo receipts
client/
  src/           # React front-end (drag/drop UI + viewers)
scripts/
  generate_samples.py
```

## Choosing an LLM Provider

`LLM_PROVIDER` controls how the backend calls the model:

- `google` (default): uses the official Google SDK; requires `GEMINI_API_KEY` from AI Studio and an image-ready model such as `gemini-2.5-flash-image`.
- `openrouter`: uses OpenRouter's OpenAI-compatible REST API. Set `GEMINI_API_KEY` to your OpenRouter key and `GEMINI_MODEL` to one of their published model slugs (e.g., `google/gemini-2.0-flash-lite`, `google/gemini-2.5-flash`).

When using OpenRouter you must also:

1. Keep `OPENROUTER_API_BASE` at `https://openrouter.ai/api/v1` (override if they change the endpoint).
2. Ensure your account has access/quota for the selected model.
3. Restart the FastAPI server after changing `.env` so the new settings take effect.

## Notes & Next Steps

- The Gemini client currently enforces JSON-only responses; additional safety settings or grounding prompts can be added if hallucinations appear.
- OCR fallback requires `pytesseract` + Tesseract CLI. Install via `sudo apt install tesseract-ocr` (Linux) or Homebrew on macOS.
- Consider persisting analysis history by writing to a database (e.g., SQLite, Postgres) and adding authentication for production deployments.
