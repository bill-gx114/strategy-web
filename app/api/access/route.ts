import { NextResponse } from "next/server";
import {
  cookieName,
  createSessionToken,
  getArchiveAccess,
  maxAgeSeconds,
  mergeArchiveAccess,
  resolveInviteCode
} from "@/src/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { code?: string };
  const resolvedAccess = body.code ? resolveInviteCode(body.code) : null;

  if (!resolvedAccess) {
    return NextResponse.json({ ok: false, message: "邀请码不正确" }, { status: 401 });
  }

  const mergedAccess = mergeArchiveAccess(await getArchiveAccess(), resolvedAccess);
  const response = NextResponse.json({ ok: true, access: mergedAccess });
  response.cookies.set(cookieName, createSessionToken(mergedAccess), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: maxAgeSeconds
  });

  return response;
}
