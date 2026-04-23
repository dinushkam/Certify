import os
from typing import Optional

# Cloud storage disabled — using local storage
USE_CLOUD_STORAGE = False

def upload_file(
    local_path: str,
    destination_key: str,
    content_type: str = "application/octet-stream"
) -> dict:
    """Local storage only — no cloud needed yet"""
    return {
        "success": True,
        "url": f"/{local_path}",
        "storage_type": "local",
        "key": local_path
    }

def get_file_url(file_path: str, base_url: str = "http://localhost:8000") -> str:
    """Get accessible URL for a file"""
    return f"{base_url}/{file_path}"

def delete_file(file_key: str) -> bool:
    """Delete local file"""
    try:
        if os.path.exists(file_key):
            os.remove(file_key)
        return True
    except Exception:
        return False