export interface Comic {
  id: string;
  name: string;
  blob: Blob;
  cover?: string; // Base64 of the first page
  timestamp: number;
}

export interface ComicPage {
  index: number;
  fileName: string;
  data: string; // Base64
}

export interface Panel {
  id: string;
  order: number;
  ymin: number; // 0-100 percentage
  xmin: number; // 0-100 percentage
  ymax: number; // 0-100 percentage
  xmax: number; // 0-100 percentage
  description?: string;
}

export type ReaderMode = 'manual' | 'smart';

export interface ViewState {
  view: 'gallery' | 'reader';
  comicId: string | null;
}
