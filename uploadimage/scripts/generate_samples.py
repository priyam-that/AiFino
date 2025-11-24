"""Generate simple sample receipts so the demo works offline."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_DIR = ROOT / "server" / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)
FONT = ImageFont.load_default()

RECEIPTS = {
    "walmart_receipt.png": [
        "WALMART SUPERCENTER",
        "123 Elm Street",
        "Austin, TX",
        "Date: 2024-08-16 14:22",
        "------------------------------",
        "Bananas      2 @ 0.59   1.18",
        "Milk 2%      1 @ 3.49   3.49",
        "Bread        1 @ 2.99   2.99",
        "Sales Tax                 0.56",
        "TOTAL DUE                8.22",
        "Paid with VISA",
    ],
    "east_repair_receipt.jpeg": [
        "EAST REPAIR SERVICE",
        "18 Customer Lane",
        "New York, NY 10001",
        "Invoice #ER-1027",
        "Date: 2024-07-09",
        "------------------------------",
        "Screen Replacement     179.99",
        "Labor (1.5h)            90.00",
        "Tax                      21.00",
        "TOTAL                   290.99",
        "Paid with MasterCard",
    ],
}


def render_receipt(lines: list[str], path: Path) -> None:
    width, height = 900, 1200
    image = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(image)
    y = 40
    for line in lines:
        draw.text((40, y), line, font=FONT, fill="black")
        y += 40
    image.save(path)


def main() -> None:
    for name, lines in RECEIPTS.items():
        render_receipt(lines, SAMPLES_DIR / name)
        print(f"Created {name}")


if __name__ == "__main__":
    main()
