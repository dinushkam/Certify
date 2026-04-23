import torch
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image
import os
import json
import sys

# Add ai_ml to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../../'))

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    '../../../ai_ml/models/best_model.pth'
)
RESULTS_PATH = os.path.join(
    os.path.dirname(__file__),
    '../../../ai_ml/models/results.json'
)

inference_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

class FraudDetectionModel(torch.nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.backbone = models.resnet18(weights=None)
        in_features = self.backbone.fc.in_features
        self.backbone.fc = torch.nn.Sequential(
            torch.nn.Dropout(0.5),
            torch.nn.Linear(in_features, 256),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.3),
            torch.nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)

def load_model():
    """Load trained model"""
    try:
        if not os.path.exists(MODEL_PATH):
            print(f"Model not found at {MODEL_PATH}")
            print("Run: python ai_ml/fraud_detection/train_model.py")
            return None

        # ✅ Add these lines before torch.load
        import numpy as np
        import torch.serialization
        torch.serialization.add_safe_globals([
            np.dtype,
            np._core.multiarray.scalar,
        ])

        model = FraudDetectionModel(num_classes=2)

        # ✅ Replace the old torch.load with this
        try:
            checkpoint = torch.load(MODEL_PATH, map_location='cpu', weights_only=True)
            print("✓ Model loaded (weights_only=True)")
        except Exception:
            checkpoint = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)
            print("✓ Model loaded (weights_only=False fallback)")

        if 'model_state_dict' in checkpoint:
            model.load_state_dict(checkpoint['model_state_dict'])
        else:
            model.load_state_dict(checkpoint)

        model.eval()
        print(f"Fraud detection model loaded! (Val Acc: {checkpoint.get('val_acc', 'N/A'):.2f}%)")
        return model
    except Exception as e:
        print(f"Could not load fraud model: {e}")
        return None


fraud_model = load_model()

def get_model_info() -> dict:
    """Get model performance metrics"""
    try:
        if os.path.exists(RESULTS_PATH):
            with open(RESULTS_PATH) as f:
                return json.load(f)
    except Exception:
        pass
    return {}

def get_risk_level(fraud_score: float) -> str:
    if fraud_score < 30:
        return "low"
    elif fraud_score < 70:
        return "medium"
    else:
        return "high"

def analyze_certificate(file_path: str) -> dict:
    """Analyze certificate image for fraud"""

    if fraud_model is None:
        return {
            "fraud_score": 0.0,
            "prediction": "pending",
            "confidence": 0.0,
            "risk_level": "unknown",
            "is_suspicious": False,
            "message": "Model not trained. Run train_model.py first.",
            "model_loaded": False
        }

    try:
        if not os.path.exists(file_path):
            return {
                "fraud_score": 0.0,
                "prediction": "error",
                "message": "File not found"
            }

        image = Image.open(file_path).convert('RGB')
        tensor = inference_transform(image).unsqueeze(0)

        with torch.no_grad():
            outputs = fraud_model(tensor)
            probs = F.softmax(outputs, dim=1)
            real_prob = probs[0][0].item()
            fake_prob = probs[0][1].item()
            prediction = "fake" if fake_prob > 0.5 else "real"
            confidence = max(real_prob, fake_prob) * 100
            fraud_score = fake_prob * 100
            risk_level = get_risk_level(fraud_score)

        return {
            "fraud_score": round(fraud_score, 2),
            "prediction": prediction,
            "confidence": round(confidence, 2),
            "real_probability": round(real_prob * 100, 2),
            "fake_probability": round(fake_prob * 100, 2),
            "risk_level": risk_level,
            "is_suspicious": fraud_score > 50,
            "message": "Analysis complete",
            "model_loaded": True
        }

    except Exception as e:
        return {
            "fraud_score": 0.0,
            "prediction": "error",
            "confidence": 0.0,
            "risk_level": "unknown",
            "is_suspicious": False,
            "message": f"Analysis error: {str(e)}",
            "model_loaded": True
        }

def auto_flag_if_risky(db, certificate_id: str, fraud_score: float):
    """Auto-flag risky certificates"""
    from app.models.fraud_flag import FraudFlag
    risk = get_risk_level(fraud_score)
    if risk in ["medium", "high"]:
        try:
            flag = FraudFlag(
                certificate_id=certificate_id,
                fraud_score=str(fraud_score),
                risk_level=risk,
                auto_flagged=True,
                reviewed=False
            )
            db.add(flag)
            db.commit()
        except Exception as e:
            print(f"Could not create fraud flag: {e}")
    return risk