import qrcode
import os
from PIL import Image

QR_FOLDER = "uploads/qrcodes"

def generate_qr_code(certificate_id: str, base_url: str = "http://localhost:5173/verify") -> str:
    """Generate QR code for a certificate and return the file path"""

    # Create folder if not exists
    os.makedirs(QR_FOLDER, exist_ok=True)

    # QR code data - verification URL
    qr_data = f"{base_url}/{certificate_id}"

    # Generate QR code
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(qr_data)
    qr.make(fit=True)

    # Create image
    img = qr.make_image(fill_color="black", back_color="white")

    # Save image
    file_path = f"{QR_FOLDER}/{certificate_id}.png"
    img.save(file_path)

    return file_path