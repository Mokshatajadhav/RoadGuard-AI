/**
 * DetectionOverlay — Canvas-based bounding box visualizer
 *
 * Props:
 *   imageUrl     {string}  Source URL of the image (img src)
 *   detections   {Array}   Array of detection objects from YOLO:
 *                          { x1, y1, x2, y2, confidence, class_name }
 *   imageWidth   {number}  Original image width from model (for coordinate scaling)
 *   imageHeight  {number}  Original image height from model
 *   className    {string}  Optional extra CSS classes on the wrapper
 */
import React, { useRef, useEffect, useState } from 'react';

export default function DetectionOverlay({
  imageUrl,
  detections = [],
  imageWidth,
  imageHeight,
  className = '',
}) {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Draw bounding boxes after image loads and whenever detections change
  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return;

    const img = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Match canvas size to the rendered <img> element
    const displayW = img.offsetWidth;
    const displayH = img.offsetHeight;
    if (displayW === 0 || displayH === 0) return;

    canvas.width = displayW;
    canvas.height = displayH;

    ctx.clearRect(0, 0, displayW, displayH);

    if (!detections || detections.length === 0) return;

    // Scale factors from model coordinates → displayed image coordinates
    const srcW = imageWidth && imageWidth > 0 ? imageWidth : (img.naturalWidth || displayW);
    const srcH = imageHeight && imageHeight > 0 ? imageHeight : (img.naturalHeight || displayH);
    const scaleX = displayW / srcW;
    const scaleY = displayH / srcH;

    detections.forEach((det, idx) => {
      const x = det.x1 * scaleX;
      const y = det.y1 * scaleY;
      const w = Math.max(8, (det.x2 - det.x1) * scaleX);
      const h = Math.max(8, (det.y2 - det.y1) * scaleY);
      const conf = Math.round((det.confidence || 0) * 100);

      // Box color: red for high conf, orange for medium, yellow for low
      const color =
        det.confidence >= 0.5 ? '#ef4444'
        : det.confidence >= 0.25 ? '#f97316'
        : '#eab308';

      // Bounding box
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x, y, w, h);

      // Semi-transparent fill
      ctx.fillStyle = color + '22'; // ~13% opacity
      ctx.fillRect(x, y, w, h);

      // Label background
      const label = `Pothole ${conf}%`;
      ctx.font = 'bold 11px monospace';
      const textMetrics = ctx.measureText(label);
      const labelW = textMetrics.width + 8;
      const labelH = 18;
      const labelX = Math.max(0, Math.min(x, displayW - labelW));
      const labelY = y > labelH + 2 ? y - labelH - 2 : y + 2;

      ctx.fillStyle = color;
      ctx.fillRect(labelX, labelY, labelW, labelH);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(label, labelX + 4, labelY + 13);
    });
  }, [imgLoaded, detections, imageWidth, imageHeight]);

  // Re-draw on window resize
  useEffect(() => {
    const handleResize = () => setImgLoaded((v) => !v); // force re-trigger
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`relative select-none w-full h-full min-h-[14rem] ${className}`}>
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Pothole analysis"
        className="w-full h-full object-cover object-center rounded-xl"
        onLoad={() => setImgLoaded(true)}
        onError={(e) => {
          e.target.src =
            'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80';
        }}
      />
      {/* Canvas sits on top of the image, pointer events disabled */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
        style={{ mixBlendMode: 'normal' }}
      />
      {/* Detection count badge */}
      {detections.length > 0 && (
        <div className="absolute top-2 right-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
          {detections.length} Pothole{detections.length !== 1 ? 's' : ''} Detected
        </div>
      )}
    </div>
  );
}
