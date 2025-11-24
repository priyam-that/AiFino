from typing import Any
from pydantic import BaseModel, Field


class LineItem(BaseModel):
    description: str = Field(..., examples=["Bananas"], description="Line item name")
    quantity: float | None = Field(None, examples=[2])
    unit_price: float | None = Field(None, examples=[1.29])
    total: float | None = Field(None, examples=[2.58])


class ReceiptData(BaseModel):
    merchant_name: str | None = None
    merchant_address: str | None = None
    purchase_date: str | None = None
    subtotal: float | None = None
    tax: float | None = None
    total: float | None = None
    payment_method: str | None = None
    currency: str | None = "RS"
    line_items: list[LineItem] = Field(default_factory=list)
    additional_fields: dict[str, Any] = Field(default_factory=dict)


class AnalyzeResponse(BaseModel):
    parsed: ReceiptData | None = None
    raw_text: str | None = None
    ocr_text: str | None = None
    warnings: list[str] = Field(default_factory=list)
