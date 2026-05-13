export type ArchiveFile = {
  id: string;
  title: string;
  category: string;
  type: "pdf" | "png" | string;
  originalFilename: string;
  relativePath: string;
  storedName: string;
  size: number;
  mtimeMs: number;
  checksum: string;
  summary: string;
  previewImage?: string | null;
  sortNumber: number;
};

export type ArchiveAccess = {
  all: boolean;
  categories: string[];
};

export type ContentManifest = {
  generatedAt: string;
  sourceDir: string;
  excludedSegment?: string;
  excludedSegments?: string[];
  files: ArchiveFile[];
};

export type CategorySummary = {
  name: string;
  count: number;
};
