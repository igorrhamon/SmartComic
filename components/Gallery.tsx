import React, { useState, useEffect } from 'react';
import { getComics, saveComic, deleteComic } from '../services/db';
import { extractPages } from '../services/comicService';
import { Comic } from '../types';
import { Plus, Trash2, BookOpen } from 'lucide-react';

interface GalleryProps {
  onSelectComic: (comicId: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ onSelectComic }) => {
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    try {
      const list = await getComics();
      setComics(list);
    } catch (err) {
      console.error("Failed to load library", err);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Create a temporary ID
      const id = crypto.randomUUID();
      
      // Extract first page for cover
      const pages = await extractPages(file);
      const cover = pages.length > 0 ? pages[0].data : undefined;

      const newComic: Comic = {
        id,
        name: file.name.replace(/\.(cdz|cbz|zip|pdf)$/i, ''),
        blob: file,
        cover,
        timestamp: Date.now(),
      };

      await saveComic(newComic);
      await loadLibrary();
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to process comic file. Ensure it is a valid ZIP/CBZ/CDZ/PDF.");
    } finally {
      setLoading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this comic from local storage?")) {
      await deleteComic(id);
      await loadLibrary();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          My Comics
        </h1>
        <label className={`
          flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-all
          ${loading ? 'bg-zinc-700 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'}
        `}>
          <Plus size={20} />
          <span>{loading ? 'Importing...' : 'Add Comic'}</span>
          <input 
            type="file" 
            accept=".cdz,.cbz,.zip,.pdf" 
            onChange={handleFileUpload} 
            disabled={loading}
            className="hidden" 
          />
        </label>
      </div>

      {comics.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
          <BookOpen size={48} className="mb-4 opacity-50" />
          <p className="text-lg">No comics found. Import a file to get started.</p>
          <p className="text-sm mt-2">Supports .cdz, .cbz, .zip, and .pdf</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {comics.map((comic) => (
            <div 
              key={comic.id}
              onClick={() => onSelectComic(comic.id)}
              className="group relative aspect-[2/3] bg-zinc-800 rounded-xl overflow-hidden cursor-pointer shadow-xl transition-transform hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/50"
            >
              {comic.cover ? (
                <img 
                  src={comic.cover} 
                  alt={comic.name} 
                  className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                  <BookOpen size={32} />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <h3 className="font-semibold text-white truncate text-shadow">{comic.name}</h3>
                <p className="text-xs text-zinc-400">
                  {new Date(comic.timestamp).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={(e) => handleDelete(e, comic.id)}
                className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;