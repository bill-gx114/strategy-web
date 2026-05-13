import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "src", "data", "content-manifest.json");
const contentDir = path.join(projectRoot, "content");
const envPath = path.join(projectRoot, ".env.local");
const allowedExtensions = new Set([".pdf", ".png"]);
const expectedCategoryCodes = [
  ["策略产品入门专栏", "INVITE_CODES_STRATEGY_PRODUCT_INTRO"],
  ["策略产品进阶专栏", "INVITE_CODES_STRATEGY_PRODUCT_ADVANCED"],
  ["推荐PM手把手入门专栏", "INVITE_CODES_RECOMMENDATION_PM"]
];

function normalizeForId(relativePath) {
  return relativePath.replaceAll(path.sep, "/");
}

function hasExcludedSegment(filePath, excludedSegments) {
  const segments = filePath.split(path.sep);
  return excludedSegments.some(segment => segments.includes(segment));
}

async function walk(dir, excludedSegments) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (hasExcludedSegment(absolutePath, excludedSegments)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...await walk(absolutePath, excludedSegments));
      continue;
    }

    if (!entry.isFile() || entry.name === ".DS_Store") {
      continue;
    }

    if (allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }

  return files;
}

async function hashFile(filePath) {
  const hash = createHash("sha256");
  await new Promise((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", chunk => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

async function loadEnv() {
  const env = {};
  let raw = "";
  try {
    raw = await readFile(envPath, "utf8");
  } catch {
    return env;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
  }
  return env;
}

function parseCodes(value) {
  return (value || "")
    .split(",")
    .map(code => code.trim())
    .filter(Boolean);
}

function fail(message) {
  throw new Error(message);
}

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const sourceDir = path.resolve(process.env.CONTENT_SOURCE_DIR || manifest.sourceDir);
  const excludedSegments = manifest.excludedSegments || [manifest.excludedSegment].filter(Boolean);
  const sourceFiles = await walk(sourceDir, excludedSegments);
  const manifestByRelativePath = new Map(manifest.files.map(file => [file.relativePath, file]));
  const sourceRelativePaths = sourceFiles.map(file => normalizeForId(path.relative(sourceDir, file)));
  const sourceRelativePathSet = new Set(sourceRelativePaths);

  if (sourceFiles.length !== manifest.files.length) {
    fail(`Source/manifest count mismatch: source=${sourceFiles.length}, manifest=${manifest.files.length}`);
  }

  for (const segment of excludedSegments) {
    const leakedFile = manifest.files.find(file => file.relativePath.split("/").includes(segment));
    if (leakedFile) {
      fail(`Excluded segment leaked into manifest (${segment}): ${leakedFile.relativePath}`);
    }
  }

  for (const relativePath of sourceRelativePaths) {
    if (!manifestByRelativePath.has(relativePath)) {
      fail(`Missing from manifest: ${relativePath}`);
    }
  }

  for (const file of manifest.files) {
    if (!sourceRelativePathSet.has(file.relativePath)) {
      fail(`Extra manifest entry not found in source: ${file.relativePath}`);
    }

    const storedPath = path.join(contentDir, file.storedName);
    const storedInfo = await stat(storedPath);
    if (storedInfo.size !== file.size) {
      fail(`Stored size mismatch for ${file.relativePath}`);
    }

    const sourcePath = path.join(sourceDir, file.relativePath);
    const sourceChecksum = await hashFile(sourcePath);
    if (sourceChecksum !== file.checksum) {
      fail(`Source checksum mismatch for ${file.relativePath}`);
    }

    const storedChecksum = await hashFile(storedPath);
    if (storedChecksum !== file.checksum) {
      fail(`Stored checksum mismatch for ${file.relativePath}`);
    }
  }

  const env = await loadEnv();
  const universalCodes = parseCodes(env.INVITE_CODES_ALL || env.INVITE_CODES);
  if (!universalCodes.length) {
    fail("Missing universal invite code in .env.local");
  }

  const categories = new Set(manifest.files.map(file => file.category));
  for (const [category, envName] of expectedCategoryCodes) {
    const codes = parseCodes(env[envName]);
    if (!codes.length) {
      fail(`Missing category invite code: ${envName}`);
    }
    if (!categories.has(category)) {
      fail(`Category invite code targets a missing category: ${category}`);
    }
  }

  console.log("Verification passed");
  console.log(`Source uploadable files: ${sourceFiles.length}`);
  console.log(`Manifest files: ${manifest.files.length}`);
  console.log(`Excluded segments: ${excludedSegments.join(", ")}`);
  console.log(`Universal code covers all ${manifest.files.length} files`);
  console.log(`Category code checks: ${expectedCategoryCodes.length}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
