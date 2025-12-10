import React, { useState, useEffect } from 'react';
import { Comic, ComicPage, ReaderMode } from '../types';
import { extractPages } from '../services/comicService';
import ManualViewer from './ManualViewer';
import SmartViewer from './SmartViewer';
import { ArrowLeft, Brain, Hand, ChevronRight, ChevronLeft } from 'lucide-react';

interface ReaderProps {
  comic: Comic;
  onBack: () => void;
}

const Reader: React.FC<ReaderProps> = ({ comic, onBack }) => {
  const [pages, setPages] = useState<ComicPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<ReaderMode>('manual');

  useEffect(() => {
    const loadPages = async () => {
      try {
        const extracted = await extractPages(comic.blob);
        setPages(extracted);
      } catch (e) {
        console.error("Failed to extract pages", e);
      } finally {
        setLoading(false);
      }
    };
    loadPages();
  }, [comic]);

  const nextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-zinc-800 rounded mb-4"></div>
          <p>Opening {comic.name}...</p>
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-white">
      {/* Top Bar */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-900 z-50 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold truncate max-w-[150px] md:max-w-md">{comic.name}</h2>
            <span className="text-xs text-zinc-400">Page {currentPageIndex + 1} of {pages.length}</span>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setMode('manual')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'manual' ? 'bg-zinc-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Hand size={14} />
            <span className="hidden sm:inline">Manual</span>
          </button>
          <button
            onClick={() => setMode('smart')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'smart' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Brain size={14} />
            <span className="hidden sm:inline">Gemini Smart</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {mode === 'manual' ? (
          <ManualViewer imageSrc={currentPage.data} />
        ) : (
          <SmartViewer imageSrc={currentPage.data} />
        )}
      </main>

      {/* Bottom Navigation (Only visible on hover/tap at bottom or usually persistent) */}
      <div className="h-16 flex items-center justify-between px-6 bg-zinc-900 border-t border-zinc-800 shrink-0">
        <button 
          onClick={prevPage} 
          disabled={currentPageIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft />
          <span className="hidden sm:inline">Prev Page</span>
        </button>
        
        <div className="w-full max-w-xs mx-4">
            <input 
                type="range" 
                min="0" 
                max={pages.length - 1} 
                value={currentPageIndex} 
                onChange={(e) => setCurrentPageIndex(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
            />
        </div>

        <button 
          onClick={nextPage} 
          disabled={currentPageIndex === pages.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <span className="hidden sm:inline">Next Page</span>
          <ChevronRight />
        </button>
      </div>
    </div>
  );
};

export default Reader;
