import { getFiles } from "@/src/lib/content";
import { zipResponse } from "@/src/lib/download";
import { canDownloadAll, getArchiveAccess, hasAnyArchiveAccess } from "@/src/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const access = await getArchiveAccess();
  if (!canDownloadAll(access)) {
    return new Response("Universal invite code required", {
      status: hasAnyArchiveAccess(access) ? 403 : 401
    });
  }

  return zipResponse(getFiles(), "策略产品资料库-全部内容.zip");
}
