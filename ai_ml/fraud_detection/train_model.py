"""
Train CNN fraud detection model on certificate dataset.
Run AFTER generate_dataset.py
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, models
from PIL import Image
import os
import json
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score, f1_score
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm import tqdm
import time

# ── PyTorch 2.6+ Safe Globals Fix (for numpy.dtype, scalar, _reconstruct) ──
import torch.serialization

# Common NumPy objects that appear in checkpoints
safe_items = [
    np.dtype,                                   # numpy.dtype
    np._core.multiarray.scalar,                 # New NumPy 2.x scalar
    getattr(np.core.multiarray, 'scalar', None) if hasattr(np, 'core') else None,
    getattr(np.core.multiarray, '_reconstruct', None) if hasattr(np, 'core') else None,
    np._core.multiarray._reconstruct if hasattr(np._core.multiarray, '_reconstruct') else None,
]

# Clean None values and add them
safe_globals_list = [item for item in safe_items if item is not None]
torch.serialization.add_safe_globals(safe_globals_list)

# ── Configuration ─────────────────────────────────────
CONFIG = {
    "data_dir": "../../datasets/processed",
    "model_save_dir": "../models",
    "batch_size": 16,
    "num_epochs": 20,
    "learning_rate": 0.0001,
    "weight_decay": 1e-4,
    "image_size": 224,
    "device": "cuda" if torch.cuda.is_available() else "cpu",
    "early_stopping_patience": 5,
}

# ── Dataset (unchanged) ─────────────────────────────────
class CertificateDataset(Dataset):
    def __init__(self, data_dir: str, transform=None):
        self.transform = transform
        self.images = []
        self.labels = []
        for label_name, label_idx in [("real", 0), ("fake", 1)]:
            label_dir = os.path.join(data_dir, label_name)
            if not os.path.exists(label_dir):
                print(f"Warning: {label_dir} not found")
                continue
            for fname in os.listdir(label_dir):
                if fname.lower().endswith(('.png', '.jpg', '.jpeg')):
                    self.images.append(os.path.join(label_dir, fname))
                    self.labels.append(label_idx)
        print(f"  Real: {self.labels.count(0)}, Fake: {self.labels.count(1)}")

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img = Image.open(self.images[idx]).convert('RGB')
        if self.transform:
            img = self.transform(img)
        return img, self.labels[idx]


# ── Model, Transforms, train_epoch, evaluate, plots (unchanged) ─────────────
class FraudDetectionModel(nn.Module):
    def __init__(self, num_classes=2):
        super().__init__()
        self.backbone = models.resnet18(weights='IMAGENET1K_V1')
        for name, param in self.backbone.named_parameters():
            if 'layer4' not in name and 'fc' not in name:
                param.requires_grad = False
        in_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(in_features, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )

    def forward(self, x):
        return self.backbone(x)


def get_transforms(image_size):
    train_tf = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.RandomHorizontalFlip(0.3),
        transforms.RandomRotation(8),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        transforms.RandomAffine(degrees=0, translate=(0.05, 0.05)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    val_tf = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    return train_tf, val_tf


def train_epoch(model, loader, criterion, optimizer, device):
    model.train()
    total_loss = 0
    correct = 0
    total = 0
    for imgs, labels in tqdm(loader, desc="  Train", leave=False):
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(imgs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        _, predicted = outputs.max(1)
        correct += predicted.eq(labels).sum().item()
        total += labels.size(0)
    return total_loss / len(loader), 100.0 * correct / total


def evaluate(model, loader, criterion, device):
    model.eval()
    total_loss = 0
    all_preds = []
    all_labels = []
    all_probs = []
    with torch.no_grad():
        for imgs, labels in tqdm(loader, desc="  Eval", leave=False):
            imgs, labels = imgs.to(device), labels.to(device)
            outputs = model(imgs)
            loss = criterion(outputs, labels)
            total_loss += loss.item()
            probs = torch.softmax(outputs, dim=1)
            _, predicted = outputs.max(1)
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
            all_probs.extend(probs[:, 1].cpu().numpy())
    accuracy = 100.0 * sum(p == l for p, l in zip(all_preds, all_labels)) / len(all_labels)
    return total_loss / len(loader), accuracy, all_preds, all_labels, all_probs


def save_training_plots(history, save_dir):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))
    axes[0].plot(history['train_loss'], label='Train', color='#0B1F3A')
    axes[0].plot(history['val_loss'], label='Val', color='#C9A84C')
    axes[0].set_title('Loss')
    axes[0].set_xlabel('Epoch')
    axes[0].legend()
    axes[1].plot(history['train_acc'], label='Train', color='#0B1F3A')
    axes[1].plot(history['val_acc'], label='Val', color='#C9A84C')
    axes[1].set_title('Accuracy (%)')
    axes[1].set_xlabel('Epoch')
    axes[1].legend()
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, 'training_history.png'), dpi=150)
    plt.close()


def save_confusion_matrix(labels, preds, save_dir):
    cm = confusion_matrix(labels, preds)
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Real', 'Fake'],
                yticklabels=['Real', 'Fake'], ax=ax)
    ax.set_ylabel('Actual')
    ax.set_xlabel('Predicted')
    ax.set_title('Confusion Matrix')
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, 'confusion_matrix.png'), dpi=150)
    plt.close()


# ── Main ──────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("CertVerify — CNN Fraud Detection Model Training")
    print("=" * 60)
    print(f"Device: {CONFIG['device']}")
    print(f"Epochs: {CONFIG['num_epochs']}")
    print(f"Batch size: {CONFIG['batch_size']}")

    os.makedirs(CONFIG['model_save_dir'], exist_ok=True)

    train_tf, val_tf = get_transforms(CONFIG['image_size'])
    print("\nLoading datasets...")

    def make_loader(split, tf, shuffle):
        ds = CertificateDataset(os.path.join(CONFIG['data_dir'], split), tf)
        return DataLoader(ds, batch_size=CONFIG['batch_size'],
                         shuffle=shuffle, num_workers=0)

    print("Train:")
    train_loader = make_loader("train", train_tf, True)
    print("Val:")
    val_loader = make_loader("val", val_tf, False)
    print("Test:")
    test_loader = make_loader("test", val_tf, False)

    if len(train_loader.dataset) == 0:
        print("\nERROR: No training data found! Run generate_dataset.py first.")
        return

    device = CONFIG['device']
    model = FraudDetectionModel(num_classes=2).to(device)

    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)

    print(f"\nModel: ResNet18 Transfer Learning")
    print(f"Total params: {total_params:,}")
    print(f"Trainable params: {trainable_params:,}")

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=CONFIG['learning_rate'],
        weight_decay=CONFIG['weight_decay']
    )
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', patience=3, factor=0.5
    )

    history = {'train_loss': [], 'val_loss': [], 'train_acc': [], 'val_acc': []}
    best_val_acc = 0
    patience_counter = 0
    best_model_path = os.path.join(CONFIG['model_save_dir'], 'best_model.pth')

    print("\nStarting training...")
    print("-" * 60)

    for epoch in range(CONFIG['num_epochs']):
        start = time.time()
        print(f"\nEpoch [{epoch+1}/{CONFIG['num_epochs']}]")

        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc, _, _, _ = evaluate(model, val_loader, criterion, device)

        scheduler.step(val_loss)

        elapsed = time.time() - start
        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['train_acc'].append(train_acc)
        history['val_acc'].append(val_acc)

        print(f"  Train — Loss: {train_loss:.4f} | Acc: {train_acc:.2f}%")
        print(f"  Val   — Loss: {val_loss:.4f} | Acc: {val_acc:.2f}%")
        print(f"  Time: {elapsed:.1f}s")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            patience_counter = 0
            torch.save({
                'epoch': epoch,
                'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(),
                'val_acc': val_acc,
                'train_acc': train_acc,
            }, best_model_path)
            print(f"  ✅ Best model saved! Val Acc: {val_acc:.2f}%")
        else:
            patience_counter += 1
            if patience_counter >= CONFIG['early_stopping_patience']:
                print(f"\nEarly stopping triggered (patience={CONFIG['early_stopping_patience']})")
                break

    # ====================== Final Test Evaluation ======================
    print("\n" + "=" * 60)
    print("Final Test Evaluation")
    print("=" * 60)

    print("Loading best model...")

    # Robust loading with multiple fallbacks
    try:
        # Preferred: weights_only=True with safe globals already registered
        checkpoint = torch.load(best_model_path, map_location=device, weights_only=True)
        print("✓ Loaded with weights_only=True")
    except Exception as e1:
        print(f"⚠️ weights_only=True failed: {type(e1).__name__}")
        try:
            # Fallback using context manager (most reliable for mixed NumPy objects)
            with torch.serialization.safe_globals(safe_globals_list):
                checkpoint = torch.load(best_model_path, map_location=device, weights_only=True)
            print("✓ Loaded with safe_globals context")
        except Exception as e2:
            print(f"⚠️ Safe context also failed. Using weights_only=False (trusted file)")
            checkpoint = torch.load(best_model_path, map_location=device, weights_only=False)

    model.load_state_dict(checkpoint['model_state_dict'])

    _, test_acc, test_preds, test_labels, test_probs = evaluate(
        model, test_loader, criterion, device
    )

    f1 = f1_score(test_labels, test_preds, average='weighted')
    auc = roc_auc_score(test_labels, test_probs) if len(set(test_labels)) > 1 else 0.0

    print(f"\nTest Accuracy:  {test_acc:.2f}%")
    print(f"F1 Score:       {f1:.4f}")
    print(f"AUC-ROC:        {auc:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(test_labels, test_preds, target_names=['Real', 'Fake']))

    save_training_plots(history, CONFIG['model_save_dir'])
    save_confusion_matrix(test_labels, test_preds, CONFIG['model_save_dir'])

    results = {
        "test_accuracy": round(test_acc, 2),
        "f1_score": round(f1, 4),
        "auc_roc": round(auc, 4),
        "best_val_accuracy": round(best_val_acc, 2),
        "total_epochs": epoch + 1,
        "device": CONFIG['device'],
        "model_path": best_model_path,
    }

    with open(os.path.join(CONFIG['model_save_dir'], 'results.json'), 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nBest Val Accuracy: {best_val_acc:.2f}%")
    print(f"Model saved at: {best_model_path}")
    print(f"Plots saved to: {CONFIG['model_save_dir']}")
    print("\nTraining complete! ✅")


if __name__ == "__main__":
    main()