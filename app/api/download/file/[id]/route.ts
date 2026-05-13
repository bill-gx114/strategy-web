import { fileResponse } from "@/src/lib/download";
import { getFileById } from "@/src/lib/content";
import { canDownloadFile, getArchiveAccess, hasAnyArchiveAccess } from "@/src/lib/auth";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const file = getFileById(id);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  const access = await getArchiveAccess();
  if (!canDownloadFile(access, file)) {
    return new Response("Invite code required for this category", {
      status: hasAnyArchiveAccess(access) ? 403 : 401
    });
  }

  return fileResponse(file);
}
