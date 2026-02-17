import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

const ImageViewer: React.FC<Props> = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Reset zoom when src changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [src]);

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(s => Math.min(s + 0.5, 5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(s => Math.max(s - 0.5, 0.5));
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent scrolling background
    e.stopPropagation();
    const delta = e.deltaY * -0.005;
    const newScale = Math.min(Math.max(0.5, scale + delta), 5);
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
        className="fixed inset-0 z-[100] bg-black/95 flex flex-col justify-center items-center overflow-hidden animate-in fade-in duration-200"
        onClick={onClose}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleZoomIn} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors" title="Phóng to"><ZoomIn size={24}/></button>
        <button onClick={handleZoomOut} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors" title="Thu nhỏ"><ZoomOut size={24}/></button>
        <button onClick={handleReset} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors" title="Mặc định"><RotateCcw size={24}/></button>
        <button onClick={onClose} className="p-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full backdrop-blur-sm ml-4 transition-colors" title="Đóng"><X size={24}/></button>
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center text-white/50 text-xs pointer-events-none">
        Cuộn chuột để zoom • Kéo để di chuyển
      </div>

      {/* Image Container */}
      <div 
        className="w-full h-full flex items-center justify-center"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => e.stopPropagation()} // Click on image container shouldn't close, only background
      >
        <img 
          src={src} 
          alt={alt || "Full screen view"} 
          className="max-w-full max-h-full transition-transform duration-75 ease-out select-none"
          style={{ 
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImageViewer;
