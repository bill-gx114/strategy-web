import path from "node:path";
import manifestJson from "@/src/data/content-manifest.json";
import type { ArchiveFile, CategorySummary, ContentManifest } from "./types";

export const manifest = manifestJson as ContentManifest;

export const contentRoot = path.join(process.cwd(), "content");

export function getFiles(): ArchiveFile[] {
  return manifest.files;
}

export function getFileById(id: string): ArchiveFile | undefined {
  return getFiles().find(file => file.id === id);
}

export function getFilesByIds(ids: string[]): ArchiveFile[] {
  const filesById = new Map(getFiles().map(file => [file.id, file]));
  return ids
    .map(id => filesById.get(id))
    .filter((file): file is ArchiveFile => Boolean(file));
}

export function getFilesByCategory(category: string): ArchiveFile[] {
  return getFiles().filter(file => file.category === decodeURIComponent(category));
}

export function getCategories(): CategorySummary[] {
  const counts = new Map<string, number>();
  for (const file of getFiles()) {
    counts.set(file.category, (counts.get(file.category) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-Hans-CN"));
}

export function getStoredPath(file: ArchiveFile): string {
  const resolved = path.join(contentRoot, file.storedName);
  const relative = path.relative(contentRoot, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid stored file path");
  }
  return resolved;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

export function safeArchiveName(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
