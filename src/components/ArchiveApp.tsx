"use client";

import { useState, type FormEvent } from "react";
import type { ArchiveAccess, ArchiveFile, CategorySummary } from "@/src/lib/types";
import { formatBytes } from "@/src/lib/content";

type Props = {
  files: ArchiveFile[];
  categories: CategorySummary[];
  generatedAt: string;
  access: ArchiveAccess;
};

type DownloadRequirement =
  | { kind: "all" }
  | { kind: "category"; category: string }
  | { kind: "selection"; categories: string[]; count: number };

const allCategory = "全部内容";

function lessonNumber(title: string) {
  const match = title.match(/第(\d+)讲|教程(\d+)|指南(\d+)|工作方式(\d+)/);
  if (!match) return 9999;
  return Number(match[1] || match[2] || match[3] || match[4]);
}

function fileLabel(file: ArchiveFile, index: number) {
  return `${file.type.toUpperCase()}-${String(index + 1).padStart(3, "0")}`;
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function emptyAccess(): ArchiveAccess {
  return { all: false, categories: [] };
}

function hasAnyAccess(access: ArchiveAccess) {
  return access.all || access.categories.length > 0;
}

function canSatisfyRequirement(access: ArchiveAccess, requirement: DownloadRequirement | null) {
  if (!requirement) return hasAnyAccess(access);
  if (requirement.kind === "all") return access.all;
  if (requirement.kind === "selection") {
    return access.all || requirement.categories.every(category => access.categories.includes(category));
  }
  return access.all || access.categories.includes(requirement.category);
}

function accessLabel(access: ArchiveAccess) {
  if (access.all) return "万能码已通过";
  if (access.categories.length) return `已解锁 ${access.categories.length} 个专栏`;
  return "免费浏览 / 下载需邀请码";
}

function requirementHint(requirement: DownloadRequirement | null) {
  if (!requirement) return "资料库支持免费浏览。下载单篇、分类包或全部资料时，需要输入你从小红书店铺收到的邀请码。";
  if (requirement.kind === "all") return "下载全部资料需要万能码。单专栏码只能下载对应专栏，不能打包下载全部内容。";
  if (requirement.kind === "selection") {
    if (requirement.categories.length === 1) {
      return `下载清单中有 ${requirement.count} 份资料，来自「${requirement.categories[0]}」。请输入这个专栏的邀请码，或使用万能码。`;
    }
    return `下载清单中有 ${requirement.count} 份资料，跨 ${requirement.categories.length} 个专栏。需要这些专栏的邀请码都已验证，或直接使用万能码。`;
  }
  return `下载「${requirement.category}」需要这个专栏的邀请码，或使用万能码。`;
}

function requirementError(requirement: DownloadRequirement | null) {
  if (!requirement) return "这个邀请码已通过，但没有匹配当前下载请求。";
  if (requirement.kind === "all") return "这个邀请码不是万能码，不能下载全部资料。请使用全部专栏的万能码。";
  if (requirement.kind === "selection") {
    return "这个邀请码已记录，但还不能覆盖当前下载清单。请继续输入缺少专栏的邀请码，或使用万能码。";
  }
  return `这个邀请码不能下载「${requirement.category}」。请使用对应专栏码或万能码。`;
}

export function ArchiveApp({ files, categories, generatedAt, access }: Props) {
  const [category, setCategory] = useState(allCategory);
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<"sequence" | "title">("sequence");
  const [selected, setSelected] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<ArchiveFile | null>(null);
  const [toast, setToast] = useState("");
  const [archiveAccess, setArchiveAccess] = useState<ArchiveAccess>(access || emptyAccess());
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [pendingDownloadUrl, setPendingDownloadUrl] = useState("");
  const [pendingRequirement, setPendingRequirement] = useState<DownloadRequirement | null>(null);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleFiles = files
    .filter(file => {
      const categoryMatched = category === allCategory || file.category === category;
      const searchable = `${file.title} ${file.category} ${file.type}`.toLowerCase();
      return categoryMatched && (!normalizedQuery || searchable.includes(normalizedQuery));
    })
    .sort((a, b) => {
      if (sortMode === "title") return a.title.localeCompare(b.title, "zh-Hans-CN");
      return a.category.localeCompare(b.category, "zh-Hans-CN") ||
        lessonNumber(a.title) - lessonNumber(b.title) ||
        a.title.localeCompare(b.title, "zh-Hans-CN");
    });

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const pdfCount = files.filter(file => file.type === "pdf").length;
  const navCategories = [{ name: allCategory, count: files.length }, ...categories];
  const filesById = new Map(files.map(file => [file.id, file]));
  const selectedFiles = selected
    .map(id => filesById.get(id))
    .filter((file): file is ArchiveFile => Boolean(file));
  const selectedCategories = Array.from(new Set(selectedFiles.map(file => file.category)));
  const selectedSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  }

  function openInvite(downloadUrl = "", requirement: DownloadRequirement | null = null) {
    setPendingDownloadUrl(downloadUrl);
    setPendingRequirement(requirement);
    setInviteError("");
    setInviteOpen(true);
  }

  function startDownload(downloadUrl: string, requirement: DownloadRequirement) {
    if (canSatisfyRequirement(archiveAccess, requirement)) {
      window.location.href = downloadUrl;
      return;
    }

    openInvite(downloadUrl, requirement);
  }

  function toggleSelected(id: string) {
    setSelected(current =>
      current.includes(id) ? current.filter(item => item !== id) : [...current, id]
    );
  }

  function downloadSelection() {
    if (!selectedFiles.length) {
      showToast("请先把资料加入下载清单。");
      return;
    }

    const params = new URLSearchParams({ ids: selectedFiles.map(file => file.id).join(",") });
    startDownload(`/api/download/selection?${params.toString()}`, {
      kind: "selection",
      categories: selectedCategories,
      count: selectedFiles.length
    });
  }

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    setArchiveAccess(emptyAccess());
    showToast("已退出下载权限。");
  }

  async function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInviteError("");
    setInviteLoading(true);

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode })
      });

      const body = await response.json().catch(() => ({ message: "邀请码不正确" }));

      if (!response.ok) {
        setInviteError(body.message || "邀请码不正确");
        return;
      }

      const nextAccess = body.access as ArchiveAccess | undefined;
      if (!nextAccess) {
        setInviteError(body.message || "邀请码不正确");
        return;
      }

      const nextDownload = pendingDownloadUrl;
      const nextRequirement = pendingRequirement;
      setArchiveAccess(nextAccess);

      if (nextDownload && !canSatisfyRequirement(nextAccess, nextRequirement)) {
        setInviteCode("");
        setInviteError(requirementError(nextRequirement));
        showToast(accessLabel(nextAccess));
        return;
      }

      setInviteOpen(false);
      setInviteCode("");
      setPendingDownloadUrl("");
      setPendingRequirement(null);
      showToast(nextDownload ? "邀请码已通过，正在开始下载。" : accessLabel(nextAccess));

      if (nextDownload) {
        window.setTimeout(() => {
          window.location.href = nextDownload;
        }, 160);
      }
    } catch {
      setInviteError("验证失败，请稍后重试。");
    } finally {
      setInviteLoading(false);
    }
  }

  function downloadCategory() {
    if (category === allCategory) {
      startDownload("/api/download/all", { kind: "all" });
      return;
    }
    startDownload(`/api/download/category/${encodeURIComponent(category)}`, {
      kind: "category",
      category
    });
  }

  return (
    <>
      <main className="shell">
        <header className="topbar">
          <a className="brand" href="#top" aria-label="返回首页">
            <div className="brand-mark">档</div>
            <div className="brand-title">
              <strong>大厂策略产品搬砖狗档案馆</strong>
              <span>Big tech strategy archive</span>
            </div>
          </a>
          <div className="top-actions">
            <span className="pill">{accessLabel(archiveAccess)}</span>
            <a className="pill" href="https://www.xiaohongshu.com/user/profile/5c5e2a8f0000000018027424" target="_blank" rel="noreferrer">小红书主页</a>
            {hasAnyAccess(archiveAccess) ? (
              <>
                {!archiveAccess.all ? (
                  <button className="btn" type="button" onClick={() => openInvite()}>追加邀请码</button>
                ) : null}
                <button className="btn" type="button" onClick={logout}>退出</button>
              </>
            ) : (
              <button className="btn" type="button" onClick={() => openInvite()}>输入邀请码</button>
            )}
            <button className="btn seal" type="button" onClick={() => startDownload("/api/download/all", { kind: "all" })}>下载全部内容</button>
          </div>
        </header>

        <section className="hero" id="top">
          <div className="hero-panel reveal">
            <div>
              <div className="eyebrow">免费浏览 / 下载验证</div>
              <h1>欢迎进入大厂策略产品搬砖狗档案馆</h1>
              <p className="hero-copy">这里整理了小红书店铺配套资料：策略产品入门、推荐 PM、进阶方法、AI 产品和职场经验。你可以先直接浏览目录、搜索关键词和查看 PDF 首屏预览；真正下载时再输入邀请码。</p>
              <div className="hero-meta">
                <span>{files.length} 份资料</span>
                <span>{pdfCount} 篇 PDF</span>
                <span>{categories.length} 个分类</span>
                <span>{archiveAccess.all ? "全部下载已开启" : archiveAccess.categories.length ? `已解锁 ${archiveAccess.categories.length} 个专栏` : "下载前验证邀请码"}</span>
              </div>
            </div>
            <div className="welcome-actions">
              <p>建议新用户先按专栏浏览，进入详情看摘要和首屏预览。单专栏码只能下载对应专栏；万能码可以下载任意专栏和全部打包内容。</p>
              <div className="welcome-action-row">
                <a className="btn primary" href="#library">开始浏览</a>
                <button className="btn seal" type="button" onClick={() => startDownload("/api/download/all", { kind: "all" })}>下载全部</button>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-grid" aria-label="内容统计">
          <div className="stat reveal"><span>Total files</span><strong>{files.length}</strong></div>
          <div className="stat reveal"><span>PDF notes</span><strong>{pdfCount}</strong></div>
          <div className="stat reveal"><span>Categories</span><strong>{categories.length}</strong></div>
          <div className="stat reveal"><span>Asset size</span><strong>{formatBytes(totalSize)}</strong></div>
        </section>

        <section className="main-grid" id="library">
          <aside className="sidebar">
            <section className="panel">
              <div className="panel-head">
                <h2>档案目录</h2>
                <span>Folders</span>
              </div>
              <div className="category-list">
                {navCategories.map(item => (
                  <button
                    className={`category-btn${category === item.name ? " active" : ""}`}
                    key={item.name}
                    type="button"
                    onClick={() => setCategory(item.name)}
                  >
                    <strong>{item.name}</strong>
                    <span>{item.count}</span>
                  </button>
                ))}
              </div>
            </section>
            <section className="panel archive-note">
              <p>使用建议：先选择左侧专栏，再通过关键词搜索定位具体内容。需要离线保存时，可以下载单篇、当前分类或全部资料。</p>
              <p className="sync-time">更新于 {formatDate(generatedAt)}</p>
            </section>
          </aside>

          <section className="content-area">
            <div className="toolbar">
              <div className="search">
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="搜索标题、分类、AI、推荐、职场、AB Test..."
                />
              </div>
              <button className="btn" type="button" onClick={() => setSortMode(sortMode === "sequence" ? "title" : "sequence")}>
                排序：{sortMode === "sequence" ? "课程序号" : "标题"}
              </button>
              <button className="btn primary" type="button" onClick={downloadCategory}>
                下载当前{category === allCategory ? "全部" : "分类"}
              </button>
            </div>

            {visibleFiles.length ? (
              <div className="archive-grid">
                {visibleFiles.map(file => {
                  const index = files.findIndex(item => item.id === file.id);
                  const isSelected = selected.includes(file.id);
                  const isUnlocked = canSatisfyRequirement(archiveAccess, {
                    kind: "category",
                    category: file.category
                  });
                  return (
                    <article className="archive-card reveal" key={file.id}>
                      <div className="card-id">
                        <span>{fileLabel(file, index)}</span>
                        <span className="file-type">{file.type}</span>
                      </div>
                      <h3>{file.title}</h3>
                      <div className="card-category">{file.category}</div>
                      <div className="card-foot">
                        <div className="mini-meta">
                          <span>{file.type === "pdf" ? "Document" : "Asset"}</span>
                          <span>{formatBytes(file.size)} · {isSelected ? "Selected" : isUnlocked ? "Unlocked" : "Preview"}</span>
                        </div>
                        <div className="card-actions">
                          <button className="text-link" type="button" onClick={() => setActiveFile(file)}>查看详情</button>
                          <button className="text-link" type="button" onClick={() => {
                            toggleSelected(file.id);
                            showToast(isSelected ? "已移出下载清单。" : "已加入下载清单。");
                          }}>
                            {isSelected ? "移出清单" : "加入清单"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state show">
                <h2>没有找到匹配内容</h2>
                <p>试试搜索「推荐」「策略」「AI」「职场」或切换分类。</p>
              </div>
            )}
          </section>
        </section>
      </main>

      <aside className={`download-dock${selected.length ? "" : " hidden"}`}>
        <strong>自选下载清单</strong>
        <span>已选中 {selectedFiles.length} 个文件，约 {formatBytes(selectedSize)}，覆盖 {selectedCategories.length} 个专栏。下载时会按你的邀请码权限生成 ZIP。</span>
        <div className="dock-actions">
          <button className="btn seal" type="button" onClick={downloadSelection}>下载清单 ZIP</button>
          <button className="btn" type="button" onClick={() => setSelected([])}>清空选择</button>
        </div>
      </aside>

      <div className={`drawer-backdrop${activeFile ? " open" : ""}`} onClick={() => setActiveFile(null)} />
      <aside className={`drawer${activeFile ? " open" : ""}`} aria-label="内容详情">
        {activeFile ? (
          <>
            <div className="drawer-head">
              <div className="drawer-title">
                <h2>{activeFile.title}</h2>
                <button className="icon-btn" type="button" onClick={() => setActiveFile(null)} aria-label="关闭">×</button>
              </div>
              <p className="card-category">{activeFile.category} / {activeFile.type.toUpperCase()} / {formatBytes(activeFile.size)}</p>
            </div>
            <div className="drawer-body">
              <div className="preview-sheet">
                <span>{activeFile.type.toUpperCase()} Preview</span>
                {activeFile.previewImage ? (
                  <figure className="pdf-preview">
                    <img src={activeFile.previewImage} alt={`${activeFile.title} 首屏预览`} />
                    <figcaption>PDF 首屏预览</figcaption>
                  </figure>
                ) : (
                  <div className="preview-placeholder">
                    <strong>暂无预览图</strong>
                    <p>这份资料仍可正常下载；如果后续同步脚本成功生成预览，会自动显示在这里。</p>
                  </div>
                )}
                <div className="summary-block">
                  <strong>内容摘要</strong>
                  <p>{activeFile.summary || `这份资料来自「${activeFile.category}」，可按需下载保存。`}</p>
                </div>
                <div className="file-facts">
                  <p>文件名：{activeFile.originalFilename}</p>
                  <p>下载权限：{canSatisfyRequirement(archiveAccess, { kind: "category", category: activeFile.category }) ? "已解锁，可直接下载" : "需要对应专栏码或万能码"}</p>
                </div>
              </div>
            </div>
            <div className="drawer-actions">
              <button className="btn primary" type="button" onClick={() => startDownload(`/api/download/file/${activeFile.id}`, { kind: "category", category: activeFile.category })}>下载这篇</button>
              <button
                className="btn"
                type="button"
                onClick={() => {
                  toggleSelected(activeFile.id);
                  showToast("下载清单已更新。");
                }}
              >
                {selected.includes(activeFile.id) ? "移出下载清单" : "加入下载清单"}
              </button>
            </div>
          </>
        ) : null}
      </aside>

      <div className={`invite-backdrop${inviteOpen ? " open" : ""}`} onClick={() => setInviteOpen(false)} />
      <aside className={`invite-modal${inviteOpen ? " open" : ""}`} aria-label="输入邀请码">
        <div className="invite-modal-head">
          <div>
            <span>Access code</span>
            <h2>下载前验证邀请码</h2>
          </div>
          <button className="icon-btn" type="button" onClick={() => setInviteOpen(false)} aria-label="关闭">×</button>
        </div>
        <p>{requirementHint(pendingRequirement)}</p>
        <form className="invite-form" onSubmit={submitInvite}>
          <label htmlFor="invite-code">邀请码</label>
          <input
            id="invite-code"
            value={inviteCode}
            onChange={event => setInviteCode(event.target.value)}
            placeholder="输入邀请码"
            autoComplete="one-time-code"
          />
          <div className="gate-error">{inviteError}</div>
          <button className="btn seal" type="submit" disabled={inviteLoading || !inviteCode.trim()}>
            {inviteLoading ? "验证中..." : pendingDownloadUrl ? "验证并开始下载" : "验证邀请码"}
          </button>
        </form>
      </aside>

      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </>
  );
}
