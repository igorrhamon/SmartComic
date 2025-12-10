import React, { useState, useEffect, useRef, useCallback } from 'react';
import { analyzeComicPage } from '../services/geminiService';
import { Panel } from '../types';
import { Sparkles, ChevronRight, ChevronLeft, Loader2, AlertCircle, Bug, ScanEye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartViewerProps {
  imageSrc: string;
}

const SmartViewer: React.FC<SmartViewerProps> = ({ imageSrc }) => {
  const [panels, setPanels] = useState<Panel[]>([]);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(-1); // -1 means full page view
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // New page loaded
    setPanels([]);
    setCurrentPanelIndex(-1);
    setError(null);
    setImageDimensions({ width: 0, height: 0 });
    analyzeImage();
  }, [imageSrc]);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      setImageDimensions({
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight
      });
    }
  }, []);

  const analyzeImage = async () => {
    setLoading(true);
    try {
      const results = await analyzeComicPage(imageSrc);
      if (results.length === 0) {
        setError("Could not detect panels. Switching to full view.");
      } else {
        setPanels(results);
        // Start with full page
        setCurrentPanelIndex(-1);
      }
    } catch (e) {
      setError("Analysis failed. Check your API key or internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const nextPanel = () => {
    if (currentPanelIndex < panels.length - 1) {
      setCurrentPanelIndex(prev => prev + 1);
    } else {
      // Loop back to full page
      setCurrentPanelIndex(-1);
    }
  };

  const prevPanel = () => {
    if (currentPanelIndex > -1) {
      setCurrentPanelIndex(prev => prev - 1);
    }
  };

  // Calculate transform for the current panel
  const getTransform = () => {
    if (currentPanelIndex === -1 || panels.length === 0 || imageDimensions.width === 0) {
      return { x: 0, y: 0, scale: 1 };
    }

    const panel = panels[currentPanelIndex];
    const { width: imgWidth, height: imgHeight } = imageDimensions;
    
    // Panel coordinates are percentages (0-100)
    // Convert to pixel positions on the actual rendered image
    const panelLeft = (panel.xmin / 100) * imgWidth;
    const panelTop = (panel.ymin / 100) * imgHeight;
    const panelRight = (panel.xmax / 100) * imgWidth;
    const panelBottom = (panel.ymax / 100) * imgHeight;
    
    const panelWidthPx = panelRight - panelLeft;
    const panelHeightPx = panelBottom - panelTop;

    // Get container/viewport dimensions
    const viewportWidth = containerRef.current?.clientWidth || window.innerWidth;
    const viewportHeight = containerRef.current?.clientHeight || window.innerHeight;

    // Calculate scale needed to fill the viewport with the panel
    const scaleX = viewportWidth / panelWidthPx;
    const scaleY = viewportHeight / panelHeightPx;
    
    // Use the smaller scale to ensure the whole panel fits, with some padding
    const scale = Math.min(Math.min(scaleX, scaleY) * 0.85, 5); 

    // Calculate panel center in pixels (relative to image top-left)
    const panelCenterX = panelLeft + panelWidthPx / 2;
    const panelCenterY = panelTop + panelHeightPx / 2;

    // Image center in pixels
    const imageCenterX = imgWidth / 2;
    const imageCenterY = imgHeight / 2;

    // Translation needed to move panel center to image center
    // Then the scaled image will be centered in viewport
    // The transform origin is center, so we translate the difference
    const tx = (imageCenterX - panelCenterX) * scale;
    const ty = (imageCenterY - panelCenterY) * scale;

    console.log(`Panel ${currentPanelIndex + 1}: img(${imgWidth}x${imgHeight}), panel(${panelWidthPx.toFixed(0)}x${panelHeightPx.toFixed(0)} at ${panelLeft.toFixed(0)},${panelTop.toFixed(0)}), scale=${scale.toFixed(2)}, translate(${tx.toFixed(0)}px, ${ty.toFixed(0)}px)`);

    return { x: tx, y: ty, scale };
  };

  const transform = getTransform();

  return (
    <div className="relative w-full h-full bg-black flex flex-col overflow-hidden">
      {/* HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 pointer-events-none">
        <button 
            onClick={() => setCurrentPanelIndex(-1)}
            disabled={loading || currentPanelIndex === -1}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full border backdrop-blur-md transition-all shadow-lg ${
                currentPanelIndex === -1 
                ? 'bg-zinc-900/50 border-zinc-800 text-zinc-400' 
                : 'bg-zinc-900/90 border-purple-500/30 text-white hover:bg-zinc-800 cursor-pointer'
            }`}
        >
            {currentPanelIndex === -1 ? (
                <ScanEye className="w-4 h-4 text-zinc-400" />
            ) : (
                <Sparkles className={`w-4 h-4 ${loading ? 'animate-pulse text-yellow-400' : 'text-purple-400'}`} />
            )}
            <span className="text-sm font-medium">
            {loading ? 'Analyzing...' : 
            error ? 'Error' : 
            currentPanelIndex === -1 ? 'Full Page' : `Panel ${currentPanelIndex + 1}/${panels.length}`}
            </span>
        </button>
        
        {!loading && panels.length > 0 && (
            <button 
                onClick={() => setShowDebug(!showDebug)}
                className={`pointer-events-auto p-2 rounded-full border backdrop-blur-md transition-colors shadow-lg ${showDebug ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-800'}`}
                title="Toggle Debug View"
            >
                <Bug size={16} />
            </button>
        )}
      </div>

      {/* Navigation Areas (Invisible buttons for tap left/right) */}
      {!loading && !error && (
        <>
          <div className="absolute inset-y-0 left-0 w-1/6 z-40 cursor-pointer hover:bg-gradient-to-r hover:from-black/20 hover:to-transparent transition-all" onClick={prevPanel} title="Previous Panel" />
          <div className="absolute inset-y-0 right-0 w-1/6 z-40 cursor-pointer hover:bg-gradient-to-l hover:from-black/20 hover:to-transparent transition-all" onClick={nextPanel} title="Next Panel" />
        </>
      )}
      
      {/* Navigation Arrows (Visible) */}
      <div className="absolute bottom-8 left-0 right-0 z-40 flex justify-center gap-12 pointer-events-none">
         <button onClick={prevPanel} disabled={loading || currentPanelIndex === -1} className="pointer-events-auto p-4 rounded-full bg-zinc-900/80 border border-zinc-800 text-white hover:bg-zinc-800 hover:scale-110 disabled:opacity-0 disabled:scale-90 transition-all shadow-xl backdrop-blur-sm">
           <ChevronLeft size={24} />
         </button>
         <button onClick={nextPanel} disabled={loading} className="pointer-events-auto p-4 rounded-full bg-zinc-900/80 border border-zinc-800 text-white hover:bg-zinc-800 hover:scale-110 disabled:opacity-0 disabled:scale-90 transition-all shadow-xl backdrop-blur-sm">
           <ChevronRight size={24} />
         </button>
      </div>

      {/* Description Overlay */}
      <AnimatePresence mode="wait">
        {!loading && currentPanelIndex !== -1 && panels[currentPanelIndex]?.description && (
          <motion.div
            key={`desc-${panels[currentPanelIndex].id}`}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute bottom-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto md:min-w-[400px] md:max-w-2xl z-50 cursor-pointer group"
            onClick={(e) => {
              e.stopPropagation();
              nextPanel();
            }}
          >
            <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl transition-all group-hover:bg-zinc-900 group-hover:border-white/20 group-hover:scale-[1.01]">
              <p className="text-zinc-100 text-base md:text-lg font-medium leading-relaxed text-center font-serif tracking-wide">
                {panels[currentPanelIndex].description}
              </p>
              <div className="mt-3 flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest text-zinc-500 font-bold group-hover:text-zinc-400 transition-colors">
                 Tap to continue <ChevronRight size={12} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center w-full h-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20 animate-pulse"></div>
                <Loader2 className="w-10 h-10 animate-spin text-purple-500 relative z-10" />
              </div>
              <p className="text-zinc-300 text-sm font-medium tracking-wide animate-pulse">Analyzing page structure...</p>
            </div>
          </div>
        )}
        
        {error && (
            <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-red-950/90 border border-red-800 text-red-200 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md">
                <AlertCircle size={20} />
                <span className="text-sm font-medium">{error}</span>
            </div>
        )}

        {/* 
            Wrapper Motion Div: 
            Using `display: inline-flex` ensures the div shrinks to fit the image size exactly.
            This ensures that coordinate percentages (0-100%) map correctly to the image content,
            fixing misalignment issues when the image doesn't fill the screen completely.
        */}
        <motion.div
            className="relative shadow-2xl origin-center inline-flex"
            initial={false}
            animate={{
                scale: transform.scale,
                x: transform.x, 
                y: transform.y
            }}
            transition={{ 
                type: "spring", 
                stiffness: 70, 
                damping: 20,
                mass: 0.8
            }}
        >
             <img 
              ref={imageRef}
              src={imageSrc} 
              alt="Comic Page" 
              className="max-w-[100vw] max-h-[100vh] object-contain block select-none"
              draggable={false}
              onLoad={handleImageLoad}
            />
            
            {/* Debug Overlay */}
            {showDebug && panels.map((p, i) => (
                <div 
                    key={p.id} 
                    className="absolute border-2 border-red-500 bg-red-500/10 z-20 flex items-start justify-start overflow-hidden pointer-events-none"
                    style={{
                         top: `${p.ymin}%`, 
                         left: `${p.xmin}%`, 
                         width: `${p.xmax - p.xmin}%`, 
                         height: `${p.ymax - p.ymin}%`
                    }}
                >
                    <div className="bg-red-600 text-white text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-br shadow-sm">
                        #{p.order}
                    </div>
                </div>
            ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SmartViewer;