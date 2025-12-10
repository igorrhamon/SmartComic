import React, { useState, useEffect } from 'react';
import Gallery from './components/Gallery';
import Reader from './components/Reader';
import { getComicById } from './services/db';
import { Comic } from './types';

function App() {
  const [currentComicId, setCurrentComicId] = useState<string | null>(null);
  const [currentComic, setCurrentComic] = useState<Comic | null>(null);

  useEffect(() => {
    if (currentComicId) {
      const fetchComic = async () => {
        const c = await getComicById(currentComicId);
        if (c) setCurrentComic(c);
        else setCurrentComicId(null);
      };
      fetchComic();
    } else {
      setCurrentComic(null);
    }
  }, [currentComicId]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-purple-500/30">
      {currentComic && currentComicId ? (
        <Reader 
          comic={currentComic} 
          onBack={() => setCurrentComicId(null)} 
        />
      ) : (
        <Gallery onSelectComic={setCurrentComicId} />
      )}
    </div>
  );
}

export default App;
