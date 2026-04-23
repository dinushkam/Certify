import torch
import torch.nn as nn
import torch.optim as optim
from torch.optim.lr_scheduler import ReduceLROnPlateau
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import os
import json
from tqdm import tqdm

from model import TransferLearningModel
from dataset import get_dataloaders

# Configuration
CONFIG = {
    "data_dir": "../../datasets/processed",
    "model_save_dir": "../models",
    "batch_size": 32,
    "num_epochs": 30,
    "learning_rate": 0.001,
    "device": "cuda" if torch.cuda.is_available() else "cpu"
}

def train_epoch(model, loader, criterion, optimizer, device):
    """Train for one epoch"""
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    
    for images, labels in tqdm(loader, desc="Training"):
        images, labels = images.to(device), labels.to(device)
        
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    
    return running_loss / len(loader), 100. * correct / total

def validate(model, loader, criterion, device):
    """Validate the model"""
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for images, labels in tqdm(loader, desc="Validating"):
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            all_preds.extend(predicted.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())
    
    return (
        running_loss / len(loader),
        100. * correct / total,
        all_preds,
        all_labels
    )

def plot_training_history(history: dict, save_dir: str):
    """Plot and save training history"""
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
    
    ax1.plot(history['train_loss'], label='Train Loss')
    ax1.plot(history['val_loss'], label='Val Loss')
    ax1.set_title('Loss over Epochs')
    ax1.set_xlabel('Epoch')
    ax1.set_ylabel('Loss')
    ax1.legend()
    
    ax2.plot(history['train_acc'], label='Train Accuracy')
    ax2.plot(history['val_acc'], label='Val Accuracy')
    ax2.set_title('Accuracy over Epochs')
    ax2.set_xlabel('Epoch')
    ax2.set_ylabel('Accuracy (%)')
    ax2.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(save_dir, 'training_history.png'))
    plt.close()
    print("Training history plot saved!")

def train():
    """Main training function"""
    
    device = CONFIG["device"]
    print(f"Using device: {device}")
    
    # Get dataloaders
    train_loader, val_loader, test_loader = get_dataloaders(
        CONFIG["data_dir"],
        CONFIG["batch_size"]
    )
    
    # Initialize model
    model = TransferLearningModel(num_classes=2).to(device)
    print("Model initialized!")
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(
        model.parameters(),
        lr=CONFIG["learning_rate"],
        weight_decay=1e-4
    )
    scheduler = ReduceLROnPlateau(
        optimizer, mode='min', patience=3, factor=0.5
    )
    
    # Training history
    history = {
        'train_loss': [], 'val_loss': [],
        'train_acc': [], 'val_acc': []
    }
    
    best_val_acc = 0.0
    os.makedirs(CONFIG["model_save_dir"], exist_ok=True)
    
    print(f"\nStarting training for {CONFIG['num_epochs']} epochs...")
    
    for epoch in range(CONFIG["num_epochs"]):
        print(f"\nEpoch [{epoch+1}/{CONFIG['num_epochs']}]")
        
        # Train
        train_loss, train_acc = train_epoch(
            model, train_loader, criterion, optimizer, device
        )
        
        # Validate
        val_loss, val_acc, preds, labels = validate(
            model, val_loader, criterion, device
        )
        
        # Update scheduler
        scheduler.step(val_loss)
        
        # Save history
        history['train_loss'].append(train_loss)
        history['val_loss'].append(val_loss)
        history['train_acc'].append(train_acc)
        history['val_acc'].append(val_acc)
        
        print(f"Train Loss: {train_loss:.4f} | Train Acc: {train_acc:.2f}%")
        print(f"Val Loss:   {val_loss:.4f} | Val Acc:   {val_acc:.2f}%")
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(
                model.state_dict(),
                os.path.join(CONFIG["model_save_dir"], "best_model.pth")
            )
            print(f"Best model saved! Val Acc: {val_acc:.2f}%")
    
    # Save final model
    torch.save(
        model.state_dict(),
        os.path.join(CONFIG["model_save_dir"], "final_model.pth")
    )
    
    # Save training history
    with open(os.path.join(CONFIG["model_save_dir"], "history.json"), "w") as f:
        json.dump(history, f)
    
    # Plot history
    plot_training_history(history, CONFIG["model_save_dir"])
    
    # Final test evaluation
    print("\nEvaluating on test set...")
    _, test_acc, test_preds, test_labels = validate(
        model, test_loader, criterion, device
    )
    
    print(f"\nFinal Test Accuracy: {test_acc:.2f}%")
    print("\nClassification Report:")
    print(classification_report(
        test_labels, test_preds,
        target_names=['Real', 'Fake']
    ))
    
    print(f"\nBest Validation Accuracy: {best_val_acc:.2f}%")
    print("Training complete!")

if __name__ == "__main__":
    train()