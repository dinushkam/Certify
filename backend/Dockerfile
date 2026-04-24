FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OCR and image processing
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    tesseract-ocr-sin \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy app code
COPY . .

# Create uploads directory
RUN mkdir -p uploads certificates

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]