"""
RoadGuard AI — Pothole Detection Script (YOLOv8)
-------------------------------------------------
Called by Node.js backend as a child process:
    python detect.py <image_path> [--model <model_path>]

Outputs a single JSON object to stdout:
  - detections: list of bounding boxes with confidence and class
  - severity: 'Severe', 'Moderate', 'Minor', or 'None'
  - hazardScore: 0-100 integer derived from real detection metrics
  - modelInfo: which model/weights were used
  - isRealInference: true when real model ran (not a demo fallback)
  - error/warning: set if inference failed or model is non-pothole

No hardcoded detection values. All stderr goes to stderr only.
"""

import sys
import json
import os
import argparse
import traceback


def parse_args():
    parser = argparse.ArgumentParser(description='RoadGuard AI pothole detector')
    parser.add_argument('image_path', help='Absolute path to the uploaded image file')
    parser.add_argument('--model', default=None,
                        help='Path to custom YOLO weights (.pt). '
                             'Defaults to auto-downloaded yolov8n.pt')
    return parser.parse_args()


def calculate_severity(detections, img_w, img_h):
    """
    Derive severity from real detection metrics.
    Returns: (severity_label: str, hazard_score: int)
    """
    if not detections:
        return 'None', 0

    # Largest detected box area as a proportion of full image
    max_area_ratio = 0.0
    max_conf = 0.0
    for d in detections:
        x1, y1, x2, y2 = d['x1'], d['y1'], d['x2'], d['y2']
        area = (x2 - x1) * (y2 - y1)
        total = max(img_w * img_h, 1)
        ratio = area / total
        max_area_ratio = max(max_area_ratio, ratio)
        max_conf = max(max_conf, d['confidence'])

    # Hazard score: blend confidence (0-1 → 60pts) + area (0-1 → 40pts)
    hazard_score = round(min(100, (max_conf * 60) + (max_area_ratio * 200)))

    if hazard_score >= 70 or max_area_ratio > 0.15:
        return 'Severe', hazard_score
    elif hazard_score >= 40 or max_area_ratio > 0.05:
        return 'Moderate', hazard_score
    else:
        return 'Minor', hazard_score


def run_yolo(image_path, model_path=None):
    """
    Run YOLOv8 inference on the given image.
    Handles both detection and segmentation model outputs.
    """
    from ultralytics import YOLO
    from PIL import Image

    # Determine which model to load
    if model_path and os.path.exists(model_path):
        model = YOLO(model_path)
        model_name = os.path.basename(model_path)
        is_pothole_model = True
        print(f'[detect.py] Using pothole model: {model_name}', file=sys.stderr)
    else:
        model = YOLO('yolov8n.pt')   # auto-downloads ~6MB on first use
        model_name = 'yolov8n.pt (COCO pretrained — not pothole-specific)'
        is_pothole_model = False
        print(f'[detect.py] No pothole.pt found, using COCO pretrained.', file=sys.stderr)

    # Get image dimensions
    with Image.open(image_path) as img:
        img_w, img_h = img.size

    # Run inference
    # - Pothole model: use lower conf=0.10 so lower-confidence but real potholes are captured
    # - COCO model: use default conf=0.25 (only clearly visible objects)
    conf_threshold = 0.10 if is_pothole_model else 0.25
    results = model(image_path, verbose=False, conf=conf_threshold)

    detections = []
    for result in results:
        # Handle both detection boxes and segmentation boxes
        boxes = getattr(result, 'boxes', None)
        if boxes is None or len(boxes) == 0:
            continue

        for box in boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            xyxy = box.xyxy[0].tolist()
            x1, y1, x2, y2 = [round(v) for v in xyxy]
            class_name = model.names.get(cls_id, str(cls_id))

            # Inclusion filter:
            # - Pothole model: include every detection (the model only knows potholes)
            # - COCO model: include any object with conf > 0.4 as a pipeline demo
            if is_pothole_model or conf > 0.40:
                detections.append({
                    'class_id': cls_id,
                    'class_name': class_name,
                    'confidence': round(conf, 4),
                    'x1': max(0, x1),
                    'y1': max(0, y1),
                    'x2': min(img_w, x2),
                    'y2': min(img_h, y2),
                    'width': max(0, min(img_w, x2) - max(0, x1)),
                    'height': max(0, min(img_h, y2) - max(0, y1)),
                })

    severity, hazard_score = calculate_severity(detections, img_w, img_h)

    return {
        'detections': detections,
        'detectionCount': len(detections),
        'imageWidth': img_w,
        'imageHeight': img_h,
        'severity': severity,
        'hazardScore': hazard_score,
        'modelInfo': model_name,
        'isPotholeSpecificModel': is_pothole_model,
        'isRealInference': True,
        'error': None,
        'warning': (
            None if is_pothole_model else
            'YOLOv8n COCO pretrained — not fine-tuned for potholes. '
            'Place a pothole-specific .pt file at backend/ai/pothole.pt for accurate results.'
        ),
    }


def error_result(message):
    return {
        'detections': [],
        'detectionCount': 0,
        'imageWidth': 0,
        'imageHeight': 0,
        'severity': 'Unknown',
        'hazardScore': 0,
        'modelInfo': 'N/A',
        'isPotholeSpecificModel': False,
        'isRealInference': False,
        'error': message,
        'warning': None,
    }


def main():
    args = parse_args()
    image_path = args.image_path
    model_path = args.model

    if not os.path.exists(image_path):
        print(json.dumps(error_result(f'Image file not found: {image_path}')))
        sys.exit(1)

    try:
        result = run_yolo(image_path, model_path)
    except ImportError as e:
        result = error_result(
            f'ultralytics not installed: {e}. Run: pip install ultralytics'
        )
    except Exception as e:
        print(traceback.format_exc(), file=sys.stderr)
        result = error_result(f'Detection failed: {e}')

    # Always output exactly one JSON line to stdout
    print(json.dumps(result))


if __name__ == '__main__':
    main()
