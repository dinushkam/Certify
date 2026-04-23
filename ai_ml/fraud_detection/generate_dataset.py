"""
Generates synthetic certificate images for CNN training.
Creates real-looking and fake (tampered) certificates.
Run this first to generate training data.
"""
import os
import random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import json

OUTPUT_DIR = "../../datasets/processed"
SAMPLES_PER_CLASS = 500  # 500 real + 500 fake = 1000 total

INSTITUTIONS = [
    "University of Colombo",
    "University of Moratuwa",
    "University of Kelaniya",
    "University of Peradeniya",
    "SLIIT",
    "NSBM Green University",
    "Informatics Institute of Technology",
    "Sri Lanka Institute of Information Technology"
]

COURSES = [
    "BSc Computer Science",
    "BSc Engineering",
    "MBA",
    "Diploma in IT",
    "Certificate in Programming",
    "BSc Business Administration",
    "MSc Data Science",
    "BSc Electrical Engineering"
]

NAMES = [
    "Kasun Perera", "Nimal Silva", "Sunil Fernando",
    "Amal Jayasinghe", "Dinesh Kumara", "Priya Wijesekara",
    "Chamari Bandara", "Ruwan Dissanayake", "Tharaka Pathirana",
    "Malith Rajapaksha", "Sachini Herath", "Buddhika Gunasekara"
]

def create_real_certificate(width=800, height=560):
    """Create a realistic-looking certificate"""
    # Background colors
    bg_colors = [
        (11, 31, 58),    # Navy
        (255, 255, 255), # White
        (26, 58, 42),    # Dark green
        (74, 14, 30),    # Burgundy
    ]
    bg = random.choice(bg_colors)
    text_color = (255, 255, 255) if sum(bg) < 400 else (11, 31, 58)
    accent = (201, 168, 76)  # Gold

    img = Image.new('RGB', (width, height), color=bg)
    draw = ImageDraw.Draw(img)

    # Border
    draw.rectangle([10, 10, width-10, height-10],
                   outline=accent, width=3)
    draw.rectangle([18, 18, width-18, height-18],
                   outline=accent, width=1)

    # Top bar
    draw.rectangle([30, 30, width-30, 34], fill=accent)
    draw.rectangle([30, height-34, width-30, height-30], fill=accent)

    # Corner dots
    for x, y in [(40,40), (width-40,40), (40,height-40), (width-40,height-40)]:
        draw.ellipse([x-5,y-5,x+5,y+5], fill=accent)

    # Institution name
    inst = random.choice(INSTITUTIONS)
    inst_text = inst.upper()
    draw.text((width//2, 90), inst_text, fill=accent, anchor="mm")

    # Tagline
    draw.text((width//2, 140), "This is to certify that",
              fill=(*text_color[:3], 180), anchor="mm")

    # Holder name
    name = random.choice(NAMES)
    draw.text((width//2, 195), name, fill=text_color, anchor="mm")

    # Underline
    name_len = len(name) * 9
    draw.line([width//2-name_len//2-20, 210,
               width//2+name_len//2+20, 210],
              fill=accent, width=2)

    # Completion text
    draw.text((width//2, 245), "has successfully completed",
              fill=(*text_color[:3], 150), anchor="mm")

    # Course
    course = random.choice(COURSES)
    draw.text((width//2, 285), course, fill=accent, anchor="mm")

    # Date
    year = random.randint(2020, 2024)
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    date_str = f"Issued on {day:02d}/{month:02d}/{year}"
    draw.text((width//2, 325), date_str,
              fill=(*text_color[:3], 130), anchor="mm")

    # Divider
    draw.line([60, 360, width-60, 360],
              fill=(*accent[:3], 100), width=1)

    # Signatory
    draw.text((width//2, 395), "Director / Principal",
              fill=text_color, anchor="mm")
    draw.text((width//2, 415), "Authorized Signatory",
              fill=(*text_color[:3], 130), anchor="mm")

    # Certificate ID
    cert_id = f"CERT-{''.join(random.choices('ABCDEF0123456789', k=12))}"
    draw.text((width//2, 445), cert_id,
              fill=(*text_color[:3], 80), anchor="mm")

    # Footer
    draw.text((width//2, 490), "CertVerify Sri Lanka — Blockchain Verified",
              fill=accent, anchor="mm")

    # Add slight noise for realism
    noise = np.random.normal(0, 3, (height, width, 3)).astype(np.int16)
    img_array = np.array(img).astype(np.int16)
    img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(img_array)

    return img, {
        "holder_name": name,
        "institution": inst,
        "course": course,
        "date": date_str,
        "certificate_id": cert_id,
        "is_fake": False
    }

def create_fake_certificate(width=800, height=560):
    """Create a tampered/fake certificate"""
    # Start with a real-looking one
    img, meta = create_real_certificate(width, height)
    draw = ImageDraw.Draw(img)

    # Apply one or more tampering techniques
    tampering = random.choice([
        "blur_region",
        "wrong_colors",
        "missing_elements",
        "pixel_artifacts",
        "compression_artifacts",
        "stretched",
        "color_shift"
    ])

    if tampering == "blur_region":
        # Blur a region (suggests editing)
        region = img.crop((200, 150, 600, 250))
        region = region.filter(ImageFilter.GaussianBlur(radius=4))
        img.paste(region, (200, 150))

    elif tampering == "wrong_colors":
        # Unusual color combination
        img_array = np.array(img)
        img_array[:, :, 0] = np.clip(img_array[:, :, 0] + 60, 0, 255)
        img_array[:, :, 1] = np.clip(img_array[:, :, 1] - 30, 0, 255)
        img = Image.fromarray(img_array.astype(np.uint8))

    elif tampering == "missing_elements":
        # Cover parts with wrong color
        draw.rectangle([30, 30, width-30, 34], fill=(255, 0, 0))
        draw.rectangle([30, height-34, width-30, height-30], fill=(255, 0, 0))

    elif tampering == "pixel_artifacts":
        # Add JPEG-like artifacts
        img_array = np.array(img)
        for _ in range(100):
            x = random.randint(0, width-1)
            y = random.randint(0, height-1)
            img_array[y, x] = [random.randint(0,255),
                               random.randint(0,255),
                               random.randint(0,255)]
        img = Image.fromarray(img_array.astype(np.uint8))

    elif tampering == "compression_artifacts":
        # Heavy JPEG compression artifacts
        import io
        buf = io.BytesIO()
        img.save(buf, format='JPEG', quality=5)
        buf.seek(0)
        img = Image.open(buf).copy()

    elif tampering == "stretched":
        # Uneven scaling (suggests copy-paste)
        img = img.resize((int(width*1.15), int(height*0.88)),
                        Image.LANCZOS)
        img = img.resize((width, height), Image.LANCZOS)

    elif tampering == "color_shift":
        # Channel swap
        img_array = np.array(img)
        img_array[:, :, [0,2]] = img_array[:, :, [2,0]]
        img = Image.fromarray(img_array.astype(np.uint8))

    meta["is_fake"] = True
    meta["tampering_type"] = tampering
    return img, meta

def generate_dataset():
    """Generate full dataset"""
    splits = {
        "train": 0.7,
        "val": 0.15,
        "test": 0.15
    }

    all_real = []
    all_fake = []

    print(f"Generating {SAMPLES_PER_CLASS} real certificates...")
    for i in range(SAMPLES_PER_CLASS):
        img, meta = create_real_certificate()
        all_real.append((img, meta))
        if (i+1) % 100 == 0:
            print(f"  Real: {i+1}/{SAMPLES_PER_CLASS}")

    print(f"Generating {SAMPLES_PER_CLASS} fake certificates...")
    for i in range(SAMPLES_PER_CLASS):
        img, meta = create_fake_certificate()
        all_fake.append((img, meta))
        if (i+1) % 100 == 0:
            print(f"  Fake: {i+1}/{SAMPLES_PER_CLASS}")

    # Split dataset
    def split_data(data, splits):
        random.shuffle(data)
        n = len(data)
        train_end = int(n * splits["train"])
        val_end = train_end + int(n * splits["val"])
        return {
            "train": data[:train_end],
            "val": data[train_end:val_end],
            "test": data[val_end:]
        }

    real_splits = split_data(all_real, splits)
    fake_splits = split_data(all_fake, splits)

    metadata = {}
    total_saved = 0

    for split_name in ["train", "val", "test"]:
        for label, items in [("real", real_splits[split_name]),
                             ("fake", fake_splits[split_name])]:
            folder = os.path.join(OUTPUT_DIR, split_name, label)
            os.makedirs(folder, exist_ok=True)
            for idx, (img, meta) in enumerate(items):
                filename = f"{label}_{split_name}_{idx:04d}.png"
                filepath = os.path.join(folder, filename)
                img.save(filepath, "PNG")
                metadata[filename] = meta
                total_saved += 1

    # Save metadata
    meta_path = os.path.join(OUTPUT_DIR, "metadata.json")
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"\nDataset generated!")
    print(f"Total images: {total_saved}")
    print(f"Distribution:")
    for split_name in ["train", "val", "test"]:
        real_n = len(real_splits[split_name])
        fake_n = len(fake_splits[split_name])
        print(f"  {split_name}: {real_n} real + {fake_n} fake = {real_n+fake_n}")
    print(f"\nSaved to: {OUTPUT_DIR}")

if __name__ == "__main__":
    generate_dataset()