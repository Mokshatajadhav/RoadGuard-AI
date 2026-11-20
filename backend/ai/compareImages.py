"""
RoadGuard AI — Image Similarity Engine
----------------------------------------
Compares two road hazard / pothole photos on disk using:
1. Difference Hash (dHash) - captures structural luminance gradients
2. Average Hash (aHash) - captures low-frequency light distribution
3. Normalized Color Histogram Correlation - captures asphalt/scene color profile

Outputs JSON to stdout:
{
  "similarity": float [0.0 - 1.0],
  "dhash": float [0.0 - 1.0],
  "ahash": float [0.0 - 1.0],
  "histogram": float [0.0 - 1.0],
  "error": null
}
"""

import sys
import json
import os
import math
from PIL import Image

def compute_dhash(img, hash_size=8):
    """64-bit difference hash based on horizontal gradient."""
    resized = img.convert('L').resize((hash_size + 1, hash_size), Image.Resampling.LANCZOS)
    pixels = list(resized.getdata())
    diff = []
    for r in range(hash_size):
        for c in range(hash_size):
            left = pixels[r * (hash_size + 1) + c]
            right = pixels[r * (hash_size + 1) + c + 1]
            diff.append(left > right)
    return diff

def compute_ahash(img, hash_size=8):
    """64-bit average hash based on mean intensity."""
    resized = img.convert('L').resize((hash_size, hash_size), Image.Resampling.LANCZOS)
    pixels = list(resized.getdata())
    avg = sum(pixels) / len(pixels)
    return [p > avg for p in pixels]

def hash_similarity(h1, h2):
    """Normalized Hamming similarity [0.0, 1.0]."""
    if len(h1) != len(h2) or len(h1) == 0:
        return 0.0
    matches = sum(b1 == b2 for b1, b2 in zip(h1, h2))
    return matches / len(h1)

def compute_hist_similarity(img1, img2):
    """Normalized RGB histogram intersection [0.0, 1.0]."""
    try:
        # Resize both to common size for fair histogram normalization
        i1 = img1.convert('RGB').resize((128, 128))
        i2 = img2.convert('RGB').resize((128, 128))
        h1 = i1.histogram()
        h2 = i2.histogram()

        # Normalize histograms so sum = 1.0
        sum1 = sum(h1) or 1
        sum2 = sum(h2) or 1
        norm1 = [v / sum1 for v in h1]
        norm2 = [v / sum2 for v in h2]

        # Histogram intersection
        intersection = sum(min(v1, v2) for v1, v2 in zip(norm1, norm2))
        return max(0.0, min(1.0, intersection))
    except Exception:
        return 0.5

def compare(path1, path2):
    if not os.path.exists(path1):
        return {"similarity": 0.0, "error": f"File not found: {path1}"}
    if not os.path.exists(path2):
        return {"similarity": 0.0, "error": f"File not found: {path2}"}

    try:
        with Image.open(path1) as img1, Image.open(path2) as img2:
            dh1 = compute_dhash(img1)
            dh2 = compute_dhash(img2)
            dhash_sim = hash_similarity(dh1, dh2)

            ah1 = compute_ahash(img1)
            ah2 = compute_ahash(img2)
            ahash_sim = hash_similarity(ah1, ah2)

            hist_sim = compute_hist_similarity(img1, img2)

            # Blended visual similarity:
            # dHash is best for structural shape (45%)
            # aHash for overall contrast/brightness (25%)
            # Histogram for color tone & asphalt composition (30%)
            blended = (dhash_sim * 0.45) + (ahash_sim * 0.25) + (hist_sim * 0.30)
            blended = round(max(0.0, min(1.0, blended)), 4)

            return {
                "similarity": blended,
                "dhash": round(dhash_sim, 4),
                "ahash": round(ahash_sim, 4),
                "histogram": round(hist_sim, 4),
                "error": None
            }
    except Exception as e:
        return {"similarity": 0.0, "error": str(e)}

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"similarity": 0.0, "error": "Usage: compareImages.py <img1> <img2>"}))
        sys.exit(1)

    res = compare(sys.argv[1], sys.argv[2])
    print(json.dumps(res))

if __name__ == "__main__":
    main()
