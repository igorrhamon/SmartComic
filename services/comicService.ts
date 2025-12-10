import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import { ComicPage } from '../types';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.0.379/build/pdf.worker.mjs';

export const extractPages = async (file: Blob): Promise<ComicPage[]> => {
  if (await isPdf(file)) {
    return extractPdfPages(file);
  }
  return extractZipPages(file);
};

const isPdf = async (file: Blob): Promise<boolean> => {
  if (file.type === 'application/pdf') return true;
  if ((file as any).name?.toLowerCase().endsWith('.pdf')) return true;
  
  // Check magic number for PDF (%PDF-)
  try {
    const buffer = await file.slice(0, 5).arrayBuffer();
    const header = new TextDecoder().decode(buffer);
    return header === '%PDF-';
  } catch (e) {
    return false;
  }
};

const extractPdfPages = async (file: Blob): Promise<ComicPage[]> => {
  const arrayBuffer = await file.arrayBuffer();
  // @ts-ignore - types for pdfjs-dist via esm.sh might be loose
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages: ComicPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    // Scale 2.0 provides good quality for reading on most screens
    const viewport = page.getViewport({ scale: 2.0 });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8);
      pages.push({
        index: i - 1,
        fileName: `page-${i.toString().padStart(3, '0')}.jpg`,
        data: base64
      });
    }
  }
  
  return pages;
};

const extractZipPages = async (file: Blob): Promise<ComicPage[]> => {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  
  const imageFiles: { name: string; obj: JSZip.JSZipObject }[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    if (!zipEntry.dir && /\.(jpg|jpeg|png|webp|gif)$/i.test(zipEntry.name)) {
      imageFiles.push({ name: zipEntry.name, obj: zipEntry });
    }
  });

  // Sort alphanumerically to ensure page order is correct (e.g., page1, page2, page10)
  imageFiles.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });

  const pages: ComicPage[] = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const base64 = await imageFiles[i].obj.async('base64');
    const mimeType = getMimeType(imageFiles[i].name);
    pages.push({
      index: i,
      fileName: imageFiles[i].name,
      data: `data:${mimeType};base64,${base64}`,
    });
  }

  return pages;
};

const getMimeType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
};