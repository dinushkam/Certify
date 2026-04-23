import pytesseract
import cv2
import numpy as np
from PIL import Image
import os
import re

# Point to Tesseract installation
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def preprocess_for_sinhala(image_path: str) -> np.ndarray:
    """Preprocess image specifically for Sinhala OCR"""

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")

    # Upscale for better OCR (Sinhala needs higher resolution)
    scale = 2.0
    width = int(img.shape[1] * scale)
    height = int(img.shape[0] * scale)
    img = cv2.resize(img, (width, height), interpolation=cv2.INTER_CUBIC)

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Denoise
    denoised = cv2.fastNlMeansDenoising(enhanced, h=15)

    # Binarize
    _, binary = cv2.threshold(
        denoised, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    return binary

def extract_sinhala_text(image_path: str) -> dict:
    """Extract Sinhala and mixed text from certificate"""

    try:
        # Preprocess
        processed = preprocess_for_sinhala(image_path)

        # Save temp
        temp_path = image_path + "_sinhala_temp.png"
        cv2.imwrite(temp_path, processed)

        # Extract Sinhala only
        sinhala_text = pytesseract.image_to_string(
            Image.open(temp_path),
            lang='sin',
            config='--psm 6 --oem 3'
        )

        # Extract English only
        english_text = pytesseract.image_to_string(
            Image.open(temp_path),
            lang='eng',
            config='--psm 6 --oem 3'
        )

        # Extract mixed (Sinhala + English together)
        mixed_text = pytesseract.image_to_string(
            Image.open(temp_path),
            lang='sin+eng',
            config='--psm 6 --oem 3'
        )

        # Get detailed data with confidence scores
        data = pytesseract.image_to_data(
            Image.open(temp_path),
            lang='sin+eng',
            output_type=pytesseract.Output.DICT
        )

        # Clean up
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # Calculate confidence
        confidences = [
            int(c) for c in data['conf']
            if str(c).isdigit() and int(c) > 0
        ]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        # Detect language
        detected_language = detect_language(mixed_text)

        return {
            "success": True,
            "sinhala_text": sinhala_text.strip(),
            "english_text": english_text.strip(),
            "mixed_text": mixed_text.strip(),
            "confidence": round(avg_confidence, 2),
            "detected_language": detected_language,
            "word_count": len(mixed_text.split()),
            "extracted_fields": extract_sinhala_fields(sinhala_text, english_text)
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "sinhala_text": "",
            "english_text": "",
            "mixed_text": "",
            "confidence": 0,
            "detected_language": "unknown",
            "extracted_fields": {}
        }

def detect_language(text: str) -> str:
    """Detect if text is primarily Sinhala, English or mixed"""

    sinhala_chars = len(re.findall(r'[\u0D80-\u0DFF]', text))
    english_chars = len(re.findall(r'[a-zA-Z]', text))
    total = sinhala_chars + english_chars

    if total == 0:
        return "unknown"

    sinhala_ratio = sinhala_chars / total

    if sinhala_ratio > 0.7:
        return "sinhala"
    elif sinhala_ratio > 0.3:
        return "mixed"
    else:
        return "english"

def extract_sinhala_fields(sinhala_text: str, english_text: str) -> dict:
    """Extract key fields from Sinhala certificate text"""

    fields = {
        "holder_name_sinhala": None,
        "institution_sinhala": None,
        "course_sinhala": None,
        "date": None,
        "certificate_number": None
    }

    # Extract date from English text
    date_pattern = r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b'
    dates = re.findall(date_pattern, english_text)
    if dates:
        fields["date"] = dates[0]

    # Extract certificate number
    cert_pattern = r'\b([A-Z]{2,4}[-/]?\d{4,10})\b'
    cert_nums = re.findall(cert_pattern, english_text)
    if cert_nums:
        fields["certificate_number"] = cert_nums[0]

    # Check for Sinhala institution keywords
    # විශ්ව විද්‍යාලය = university
    # විද්‍යාලය = college/school
    sinhala_keywords = ['විශ්ව', 'විද්‍යාලය', 'ආයතනය', 'පාසල']
    for keyword in sinhala_keywords:
        if keyword in sinhala_text:
            idx = sinhala_text.index(keyword)
            fields["institution_sinhala"] = sinhala_text[
                max(0, idx-10):idx+30
            ].strip()
            break

    return fields

def process_bilingual_certificate(file_path: str) -> dict:
    """Process a certificate that may contain both Sinhala and English"""

    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.pdf':
        return {
            "success": False,
            "error": "PDF Sinhala extraction coming soon",
            "mixed_text": "",
            "confidence": 0
        }
    elif ext in ['.jpg', '.jpeg', '.png', '.bmp']:
        return extract_sinhala_text(file_path)
    else:
        return {
            "success": False,
            "error": f"Unsupported file type: {ext}"
        }