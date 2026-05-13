import archiver from "archiver";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { PassThrough, Readable } from "node:stream";
import { getStoredPath, safeArchiveName } from "./content";
import type { ArchiveFile } from "./types";

export function attachmentHeader(filename: string) {
  const safeName = safeArchiveName(filename);
  return `attachment; filename="${encodeURIComponent(safeName)}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
}

export async function fileResponse(file: ArchiveFile) {
  const filePath = getStoredPath(file);
  const info = await stat(filePath);
  const stream = createReadStream(filePath);
  const body = Readable.toWeb(stream) as ReadableStream;

  return new Response(body, {
    headers: {
      "Content-Type": file.type === "png" ? "image/png" : "application/pdf",
      "Content-Length": String(info.size),
      "Content-Disposition": attachmentHeader(file.originalFilename),
      "Cache-Control": "private, no-store"
    }
  });
}

export function zipResponse(files: ArchiveFile[], filename: string) {
  const archive = archiver("zip", { zlib: { level: 6 } });
  const passThrough = new PassThrough();

  archive.on("error", error => passThrough.destroy(error));
  archive.pipe(passThrough);

  for (const file of files) {
    archive.file(getStoredPath(file), {
      name: `${safeArchiveName(file.category)}/${safeArchiveName(file.originalFilename)}`
    });
  }

  void archive.finalize();

  return new Response(Readable.toWeb(passThrough) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": attachmentHeader(filename),
      "Cache-Control": "private, no-store"
    }
  });
}
