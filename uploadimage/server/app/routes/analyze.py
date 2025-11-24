from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.schemas.analyze import AnalyzeResponse
from app.services.analyzer import ReceiptAnalyzer

router = APIRouter(prefix="/api", tags=["analysis"])
_analyzer = ReceiptAnalyzer()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_document(file: UploadFile = File(...)) -> AnalyzeResponse:
    if file.size is not None and file.size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    
    if not file.content_type or not file.content_type.startswith(("image/", "application/pdf")):
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type: {file.content_type}. Please upload an image (PNG, JPG) or PDF."
        )
    
    try:
        result = await _analyzer.process(file)
        return result
    except Exception as exc:
        # Return a proper response even on error, with error in warnings
        error_message = str(exc)
        return AnalyzeResponse(
            parsed=None,
            raw_text=None,
            ocr_text=None,
            warnings=[f"Analysis failed: {error_message}"]
        )
    finally:
        await file.close()
