import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";
import type { ArchiveAccess, ArchiveFile } from "./types";

const cookieName = "strategy_archive_access";
const maxAgeSeconds = 60 * 60 * 24 * 30;

const noAccess: ArchiveAccess = { all: false, categories: [] };
const allAccess: ArchiveAccess = { all: true, categories: [] };

const categoryInviteRules = [
  {
    category: "策略产品入门专栏",
    envName: "INVITE_CODES_STRATEGY_PRODUCT_INTRO"
  },
  {
    category: "策略产品进阶专栏",
    envName: "INVITE_CODES_STRATEGY_PRODUCT_ADVANCED"
  },
  {
    category: "推荐PM手把手入门专栏",
    envName: "INVITE_CODES_RECOMMENDATION_PM"
  }
] as const;

function getSessionSecret() {
  return process.env.SESSION_SECRET || "local-preview-session-secret";
}

function base64url(input: string) {
  return Buffer.from(input).toString("base64url");
}

function fromBase64url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function parseCodes(value?: string) {
  return (value || "")
    .split(",")
    .map(code => code.trim())
    .filter(Boolean);
}

function timingSafeCodeEqual(incoming: string, validCode: string) {
  const left = Buffer.from(incoming);
  const right = Buffer.from(validCode);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function normalizeAccess(access?: Partial<ArchiveAccess> | null): ArchiveAccess | null {
  if (!access) return null;
  if (access.all) return allAccess;

  const categories = Array.isArray(access.categories)
    ? access.categories.filter((category): category is string => typeof category === "string")
    : [];

  if (!categories.length) return null;
  return {
    all: false,
    categories: sortCategories(Array.from(new Set(categories)))
  };
}

function sortCategories(categories: string[]) {
  const order: string[] = categoryInviteRules.map(rule => rule.category);
  return categories.sort((a, b) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex !== -1 || bIndex !== -1) {
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    }
    return a.localeCompare(b, "zh-Hans-CN");
  });
}

export function getInviteCodes(): string[] {
  return parseCodes(process.env.INVITE_CODES_ALL || process.env.INVITE_CODES || "ARCHIVE-2026");
}

export function resolveInviteCode(code: string): ArchiveAccess | null {
  const incoming = code.trim();
  if (!incoming) return null;

  if (getInviteCodes().some(validCode => timingSafeCodeEqual(incoming, validCode))) {
    return allAccess;
  }

  for (const rule of categoryInviteRules) {
    const codes = parseCodes(process.env[rule.envName]);
    if (codes.some(validCode => timingSafeCodeEqual(incoming, validCode))) {
      return { all: false, categories: [rule.category] };
    }
  }

  return null;
}

export function isValidInviteCode(code: string) {
  return Boolean(resolveInviteCode(code));
}

export function mergeArchiveAccess(current: ArchiveAccess, next: ArchiveAccess): ArchiveAccess {
  if (current.all || next.all) return allAccess;
  return {
    all: false,
    categories: sortCategories(Array.from(new Set([...current.categories, ...next.categories])))
  };
}

export function hasAnyArchiveAccess(access: ArchiveAccess) {
  return access.all || access.categories.length > 0;
}

export function canDownloadAll(access: ArchiveAccess) {
  return access.all;
}

export function canDownloadCategory(access: ArchiveAccess, category: string) {
  return access.all || access.categories.includes(category);
}

export function canDownloadFile(access: ArchiveAccess, file: ArchiveFile) {
  return canDownloadCategory(access, file.category);
}

export function createSessionToken(access: ArchiveAccess = allAccess) {
  const payload = base64url(JSON.stringify({ iat: Date.now(), access }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token?: string): ArchiveAccess | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    return null;
  }

  try {
    const parsed = JSON.parse(fromBase64url(payload)) as {
      iat?: number;
      access?: Partial<ArchiveAccess>;
    };
    if (!parsed.iat) return null;
    if (Date.now() - parsed.iat >= maxAgeSeconds * 1000) return null;

    // Existing sessions from the previous invite-only version had no scope payload.
    if (parsed.access === undefined) return allAccess;
    return normalizeAccess(parsed.access);
  } catch {
    return null;
  }
}

export async function getArchiveAccess() {
  const cookieStore = await cookies();
  return getArchiveAccessFromCookies(cookieStore);
}

export function getArchiveAccessFromCookies(cookieStore: ReadonlyRequestCookies) {
  return verifySessionToken(cookieStore.get(cookieName)?.value) || noAccess;
}

export async function hasArchiveAccess() {
  return hasAnyArchiveAccess(await getArchiveAccess());
}

export function hasArchiveAccessFromCookies(cookieStore: ReadonlyRequestCookies) {
  return hasAnyArchiveAccess(getArchiveAccessFromCookies(cookieStore));
}

export { categoryInviteRules, cookieName, maxAgeSeconds };
