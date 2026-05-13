import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { createReadStream } from "node:fs";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const execFile = promisify(execFileCallback);

const sourceDir = path.resolve(
  process.env.CONTENT_SOURCE_DIR || "/Users/gongxin/Downloads/乱七八糟/自媒体内容整理"
);
const excludedSegments = ["不要上传的内容", "小红书商业合作"];
const contentDir = path.join(projectRoot, "content");
const previewDir = path.join(projectRoot, "public", "previews");
const manifestPath = path.join(projectRoot, "src", "data", "content-manifest.json");
const allowedExtensions = new Set([".pdf", ".png"]);

function assertInsideProject(targetPath) {
  const relative = path.relative(projectRoot, targetPath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside project: ${targetPath}`);
  }
}

function hasExcludedSegment(filePath) {
  const segments = filePath.split(path.sep);
  return excludedSegments.some(segment => segments.includes(segment));
}

function assertNoExcludedSegment(relativePath) {
  const segments = normalizeForId(relativePath).split("/");
  const matched = excludedSegments.find(segment => segments.includes(segment));
  if (matched) {
    throw new Error(`Excluded content reached copy stage (${matched}): ${relativePath}`);
  }
}

function normalizeForId(relativePath) {
  return relativePath.replaceAll(path.sep, "/");
}

function stableId(relativePath) {
  return createHash("sha1").update(normalizeForId(relativePath)).digest("hex").slice(0, 16);
}

function titleFromFilename(filename) {
  return filename.replace(/\.[^.]+$/, "").replaceAll("_", " ").trim();
}

function topicFromTitle(title) {
  return title
    .replace(/^推荐PM手把手入门第\d+讲[:：]?/, "")
    .replace(/^策略产品经理入门教程\d+[:：]?/, "")
    .replace(/^策略PM进阶教程\d+[:：]?/, "")
    .replace(/^PM实习生通关指南\d+[:：]?/, "")
    .replace(/^AI时代的策略产品工作方式\d+[:：]?/, "")
    .replace(/^产品实习生.*?[:：]/, "")
    .replace(/\s+/g, " ")
    .trim() || title;
}

function buildSummary(title, category, type) {
  if (type !== "pdf") {
    return `这是一份来自「${category}」的配套素材，可在详情页确认文件信息后下载保存。`;
  }

  const topic = topicFromTitle(title);
  if (category.includes("推荐PM")) {
    return `本篇围绕「${topic}」拆解推荐产品与算法策略工作中的关键问题，适合用来理解流量分发、指标权衡、运营协同和策略边界。`;
  }
  if (category.includes("策略产品入门")) {
    return `本篇围绕「${topic}」建立策略产品基础认知，适合入门阶段快速理解方法框架、业务场景和常见分析路径。`;
  }
  if (category.includes("策略产品进阶")) {
    return `本篇围绕「${topic}」展开进阶拆解，重点放在复杂策略判断、实验评估、系统协同和可落地的产品决策。`;
  }
  if (category.includes("AI时代")) {
    return `本篇围绕「${topic}」整理 AI 时代策略产品的工作方式，适合用于理解 AI 工具、策略岗位能力迁移和新型协作流程。`;
  }
  if (category.includes("职场")) {
    return `本篇围绕「${topic}」记录策略产品相关的职场经验，适合用于准备沟通、成长复盘、岗位选择和日常工作判断。`;
  }
  if (category.includes("热点")) {
    return `本篇围绕「${topic}」做热点事件下的产品观察，适合用来训练商业敏感度、行业判断和策略产品视角。`;
  }
  if (category.includes("透镜")) {
    return `本篇围绕「${topic}」从策略产品视角观察具体业务，适合用来练习结构化分析、问题拆解和方案判断。`;
  }
  if (category.includes("实习")) {
    return `本篇围绕「${topic}」整理产品实习相关经验，适合用于简历、面试、入职准备和实习阶段的工作方法参考。`;
  }

  return `本篇来自「${category}」，围绕「${topic}」整理核心观点和操作思路，适合先浏览摘要与首屏预览，再按需下载保存。`;
}

function inferSortNumber(title) {
  const match = title.match(/第(\d+)讲|教程(\d+)|指南(\d+)|工作方式(\d+)/);
  if (!match) return 9999;
  return Number(match[1] || match[2] || match[3] || match[4]);
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

async function createPdfPreview(absolutePath, id) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "strategy-archive-preview-"));

  try {
    const targetPath = path.join(tempDir, `${id}.png`);
    await execFile("sips", ["-s", "format", "png", "-Z", "900", absolutePath, "--out", targetPath], {
      timeout: 30000,
      maxBuffer: 1024 * 1024
    });
    await cp(targetPath, path.join(previewDir, `${id}.png`));
    return `/previews/${id}.png`;
  } catch (error) {
    console.warn(`Preview skipped for ${path.basename(absolutePath)}: ${error.message}`);
    return null;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function createPreview(absolutePath, id, extension) {
  if (extension === ".pdf") {
    return createPdfPreview(absolutePath, id);
  }

  if (extension === ".png") {
    const targetPath = path.join(previewDir, `${id}.png`);
    await cp(absolutePath, targetPath);
    return `/previews/${id}.png`;
  }

  return null;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (hasExcludedSegment(absolutePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...await walk(absolutePath));
      continue;
    }

    if (!entry.isFile() || entry.name === ".DS_Store") {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      continue;
    }

    files.push(absolutePath);
  }

  return files;
}

async function loadPreviousManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return { files: [] };
  }
}

async function main() {
  assertInsideProject(contentDir);
  assertInsideProject(previewDir);
  assertInsideProject(manifestPath);

  const previous = await loadPreviousManifest();
  const previousByRelativePath = new Map(
    (previous.files || []).map(file => [file.relativePath, file])
  );

  await rm(contentDir, { recursive: true, force: true });
  await rm(previewDir, { recursive: true, force: true });
  await mkdir(contentDir, { recursive: true });
  await mkdir(previewDir, { recursive: true });
  await mkdir(path.dirname(manifestPath), { recursive: true });

  const sourceFiles = (await walk(sourceDir)).sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN")
  );

  const manifestFiles = [];

  for (const absolutePath of sourceFiles) {
    const relativePath = normalizeForId(path.relative(sourceDir, absolutePath));
    assertNoExcludedSegment(relativePath);

    const info = await stat(absolutePath);
    const extension = path.extname(absolutePath).toLowerCase();
    const id = stableId(relativePath);
    const storedName = `${id}${extension}`;
    const storedPath = path.join(contentDir, storedName);
    const category = relativePath.includes("/")
      ? relativePath.split("/")[0]
      : "其他资料";
    const filename = path.basename(absolutePath);
    const title = titleFromFilename(filename);
    const previousFile = previousByRelativePath.get(relativePath);
    const checksum = previousFile &&
      previousFile.size === info.size &&
      previousFile.mtimeMs === Math.round(info.mtimeMs)
      ? previousFile.checksum
      : await hashFile(absolutePath);

    await cp(absolutePath, storedPath);
    const previewImage = await createPreview(absolutePath, id, extension);

    manifestFiles.push({
      id,
      title,
      category,
      type: extension.slice(1),
      originalFilename: filename,
      relativePath,
      storedName,
      size: info.size,
      mtimeMs: Math.round(info.mtimeMs),
      checksum,
      summary: buildSummary(title, category, extension.slice(1)),
      previewImage,
      sortNumber: inferSortNumber(filename)
    });
  }

  manifestFiles.sort((a, b) =>
    a.category.localeCompare(b.category, "zh-Hans-CN") ||
    a.sortNumber - b.sortNumber ||
    a.title.localeCompare(b.title, "zh-Hans-CN")
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceDir,
    excludedSegments,
    files: manifestFiles
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  const byType = manifestFiles.reduce((acc, file) => {
    acc[file.type] = (acc[file.type] || 0) + 1;
    return acc;
  }, {});

  console.log(`Synced ${manifestFiles.length} files from ${sourceDir}`);
  console.log(`Excluded any path segment named: ${excludedSegments.join(", ")}`);
  console.log(JSON.stringify(byType));
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
