import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from 'lucide-react';

interface ManualViewerProps {
  imageSrc: string;
}

const ManualViewer: React.FC<ManualViewerProps> = ({ imageSrc }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset on image change
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [imageSrc]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY * -0.01;
      const newScale = Math.min(Math.max(0.5, scale + delta), 5);
      setScale(newScale);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex flex-col">
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-zinc-900/80 p-2 rounded-lg backdrop-blur-sm border border-zinc-700/50">
        <button onClick={() => setScale(s => Math.min(s + 0.5, 5))} className="p-2 hover:bg-zinc-700 rounded-md text-white">
          <ZoomIn size={20} />
        </button>
        <button onClick={() => setScale(s => Math.max(s - 0.5, 0.5))} className="p-2 hover:bg-zinc-700 rounded-md text-white">
          <ZoomOut size={20} />
        </button>
        <button onClick={resetView} className="p-2 hover:bg-zinc-700 rounded-md text-white">
          <RotateCcw size={20} />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-hidden cursor-move"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img 
          src={imageSrc} 
          alt="Page" 
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          className="select-none shadow-2xl"
        />
      </div>
    </div>
  );
};

export default ManualViewer;
