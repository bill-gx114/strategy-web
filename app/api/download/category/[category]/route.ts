import { getFilesByCategory, safeArchiveName } from "@/src/lib/content";
import { zipResponse } from "@/src/lib/download";
import { canDownloadCategory, getArchiveAccess, hasAnyArchiveAccess } from "@/src/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_request: Request, context: { params: Promise<{ category: string }> }) {
  const { category } = await context.params;
  const decodedCategory = decodeURIComponent(category);
  const files = getFilesByCategory(decodedCategory);
  if (!files.length) {
    return new Response("Not found", { status: 404 });
  }

  const access = await getArchiveAccess();
  if (!canDownloadCategory(access, decodedCategory)) {
    return new Response("Invite code required for this category", {
      status: hasAnyArchiveAccess(access) ? 403 : 401
    });
  }

  return zipResponse(files, `${safeArchiveName(decodedCategory)}.zip`);
}
