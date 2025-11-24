"""Basic receipt parser that extracts structured data from OCR text."""

from __future__ import annotations

import re
from typing import Any

from app.schemas.analyze import LineItem, ReceiptData


def parse_receipt_from_ocr(ocr_text: str) -> ReceiptData:
    """Extract basic receipt fields from OCR text using simple pattern matching."""
    if not ocr_text:
        return ReceiptData()

    lines = ocr_text.split("\n")
    text = ocr_text.lower()

    # Extract merchant name (usually first non-empty line)
    merchant_name = None
    for line in lines[:5]:  # Check first 5 lines
        line = line.strip()
        if line and len(line) > 2 and not re.match(r"^\d+[/-]\d+", line):  # Not a date
            merchant_name = line
            break

    # Extract date patterns
    purchase_date = None
    date_patterns = [
        r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",  # MM/DD/YYYY or DD/MM/YYYY
        r"(\d{4}[/-]\d{1,2}[/-]\d{1,2})",  # YYYY-MM-DD
    ]
    for pattern in date_patterns:
        match = re.search(pattern, ocr_text)
        if match:
            purchase_date = match.group(1)
            break

    # Extract totals (look for "total", "amount", etc.)
    total = None
    subtotal = None
    tax = None

    # Look for total patterns
    total_patterns = [
        r"total[:\s]*\$?([\d,]+\.?\d*)",
        r"amount[:\s]*\$?([\d,]+\.?\d*)",
        r"grand\s+total[:\s]*\$?([\d,]+\.?\d*)",
    ]
    for pattern in total_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                total = float(match.group(1).replace(",", ""))
                break
            except ValueError:
                pass

    # Look for subtotal
    subtotal_match = re.search(r"subtotal[:\s]*\$?([\d,]+\.?\d*)", text, re.IGNORECASE)
    if subtotal_match:
        try:
            subtotal = float(subtotal_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Look for tax
    tax_match = re.search(r"tax[:\s]*\$?([\d,]+\.?\d*)", text, re.IGNORECASE)
    if tax_match:
        try:
            tax = float(tax_match.group(1).replace(",", ""))
        except ValueError:
            pass

    # Extract line items (lines with prices)
    line_items: list[LineItem] = []
    price_pattern = r"\$?([\d,]+\.?\d{2})"
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 3:
            continue
        
        # Look for lines that might be items (contain price at end)
        price_match = re.search(rf"{price_pattern}\s*$", line)
        if price_match:
            try:
                price = float(price_match.group(1).replace(",", ""))
                # Remove price from description
                description = re.sub(rf"{price_pattern}\s*$", "", line).strip()
                if description and price > 0:
                    line_items.append(
                        LineItem(
                            description=description,
                            quantity=None,
                            unit_price=None,
                            total=price,
                        )
                    )
            except (ValueError, IndexError):
                pass

    # Extract payment method
    payment_method = None
    payment_keywords = {
        "cash": "Cash",
        "credit": "Credit Card",
        "debit": "Debit Card",
        "visa": "Visa",
        "mastercard": "Mastercard",
        "amex": "American Express",
        "paypal": "PayPal",
    }
    for keyword, method in payment_keywords.items():
        if keyword in text:
            payment_method = method
            break

    # Extract address (look for common address patterns)
    merchant_address = None
    address_pattern = r"(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|drive|dr|lane|ln)[\w\s,]*\d{5})"
    address_match = re.search(address_pattern, ocr_text, re.IGNORECASE)
    if address_match:
        merchant_address = address_match.group(1).strip()

    return ReceiptData(
        merchant_name=merchant_name,
        merchant_address=merchant_address,
        purchase_date=purchase_date,
        subtotal=subtotal,
        tax=tax,
        total=total,
        payment_method=payment_method,
        line_items=line_items[:20],  # Limit to 20 items
        currency="RS",
    )

