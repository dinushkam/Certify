import easyocr
import cv2
import numpy as np
from PIL import Image
import os
import re

# Initialize EasyOCR reader (English)
# First time will download the model (~100MB)
print("Loading OCR model...")
reader = easyocr.Reader(['en'], gpu=False)
print("OCR model loaded!")

def preprocess_image(image_path: str) -> np.ndarray:
    """Preprocess image for better OCR accuracy"""
    
    # Read image
    img = cv2.imread(image_path)
    
    if img is None:
        raise ValueError(f"Could not read image: {image_path}")
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply threshold to get black/white image
    _, thresh = cv2.threshold(
        gray, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    
    # Remove noise
    denoised = cv2.fastNlMeansDenoising(thresh, h=10)
    
    return denoised

def extract_text_from_image(image_path: str) -> dict:
    """Extract text from certificate image using EasyOCR"""
    
    try:
        # Preprocess image
        processed = preprocess_image(image_path)
        
        # Save preprocessed image temporarily
        temp_path = image_path + "_processed.png"
        cv2.imwrite(temp_path, processed)
        
        # Run OCR
        results = reader.readtext(temp_path)
        
        # Clean up temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        # Extract text and confidence
        extracted_texts = []
        confidences = []
        
        for (bbox, text, confidence) in results:
            extracted_texts.append(text)
            confidences.append(confidence)
        
        # Join all text
        full_text = " ".join(extracted_texts)
        
        # Calculate average confidence
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Extract key fields from text
        extracted_fields = extract_key_fields(full_text)
        
        return {
            "success": True,
            "full_text": full_text,
            "confidence": round(avg_confidence * 100, 2),
            "extracted_fields": extracted_fields,
            "raw_results": [
                {
                    "text": text,
                    "confidence": round(conf * 100, 2)
                }
                for (_, text, conf) in results
            ]
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "full_text": "",
            "confidence": 0,
            "extracted_fields": {}
        }

def extract_key_fields(text: str) -> dict:
    """Extract key certificate fields from OCR text"""
    
    fields = {
        "holder_name": None,
        "institution": None,
        "course": None,
        "date": None,
        "certificate_number": None
    }
    
    text_lower = text.lower()
    
    # Extract date (common formats)
    date_pattern = r'\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{1,2}[/-]\d{1,2})\b'
    dates = re.findall(date_pattern, text)
    if dates:
        fields["date"] = dates[0]
    
    # Extract certificate/registration number
    cert_pattern = r'\b([A-Z]{2,4}[-/]?\d{4,10})\b'
    cert_numbers = re.findall(cert_pattern, text)
    if cert_numbers:
        fields["certificate_number"] = cert_numbers[0]
    
    # Look for name after common keywords
    name_keywords = ["awarded to", "certify that", "this is to certify", "presented to"]
    for keyword in name_keywords:
        if keyword in text_lower:
            idx = text_lower.index(keyword) + len(keyword)
            potential_name = text[idx:idx+50].strip()
            if potential_name:
                fields["holder_name"] = potential_name.split("\n")[0].strip()
            break
    
    # Look for university/institution
    institution_keywords = ["university", "college", "institute", "school", "academy"]
    for keyword in institution_keywords:
        if keyword in text_lower:
            idx = text_lower.index(keyword)
            start = max(0, idx - 30)
            fields["institution"] = text[start:idx+50].strip()
            break
    
    return fields

def extract_text_from_pdf(pdf_path: str) -> dict:
    """Extract text from PDF certificate"""
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(pdf_path)
        full_text = ""
        
        for page in doc:
            full_text += page.get_text()
        
        doc.close()
        
        extracted_fields = extract_key_fields(full_text)
        
        return {
            "success": True,
            "full_text": full_text,
            "confidence": 95.0,
            "extracted_fields": extracted_fields
        }
        
    except ImportError:
        return {
            "success": False,
            "error": "PyMuPDF not installed. Run: pip install pymupdf",
            "full_text": "",
            "confidence": 0,
            "extracted_fields": {}
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "full_text": "",
            "confidence": 0,
            "extracted_fields": {}
        }

def process_certificate_file(file_path: str) -> dict:
    """Process any certificate file (image or PDF)"""
    
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".jpg", ".jpeg", ".png", ".bmp", ".tiff"]:
        return extract_text_from_image(file_path)
    else:
        return {
            "success": False,
            "error": f"Unsupported file type: {ext}",
            "full_text": "",
            "confidence": 0,
            "extracted_fields": {}
        }