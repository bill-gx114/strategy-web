import { canDownloadFile, getArchiveAccess, hasAnyArchiveAccess } from "@/src/lib/auth";
import { getFilesByIds } from "@/src/lib/content";
import { zipResponse } from "@/src/lib/download";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseIds(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids") || "";
  return Array.from(new Set(
    ids
      .split(",")
      .map(id => id.trim())
      .filter(Boolean)
  ));
}

export async function GET(request: Request) {
  const ids = parseIds(request);
  if (!ids.length) {
    return new Response("No files selected", { status: 400 });
  }

  const files = getFilesByIds(ids);
  if (files.length !== ids.length) {
    return new Response("Some selected files were not found", { status: 404 });
  }

  const access = await getArchiveAccess();
  const unauthorizedFile = files.find(file => !canDownloadFile(access, file));
  if (unauthorizedFile) {
    return new Response(`Invite code required for ${unauthorizedFile.category}`, {
      status: hasAnyArchiveAccess(access) ? 403 : 401
    });
  }

  return zipResponse(files, `大厂策略产品搬砖狗档案馆-下载清单-${files.length}份.zip`);
}
