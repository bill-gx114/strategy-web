# Strategy Archive Site

个人自媒体资料归档站点，线上地址：

https://strategy-archive-site.vercel.app

这个项目负责把本机资料目录中的 PDF 同步到 Next.js 站点中，生成内容清单、PDF 首屏预览、下载接口和邀请码权限控制。

## 目录关系

项目源码目录：

```bash
/Users/gongxin/Documents/Projects/strategy-archive-site
```

内容源目录：

```bash
/Users/gongxin/Downloads/乱七八糟/自媒体内容整理
```

日常只需要维护内容源目录。同步脚本会从内容源目录读取资料，复制到项目的 `content/`，并生成 `src/data/content-manifest.json` 与 `public/previews/`。

## 不同步的目录

同步时会跳过任何路径中包含以下目录名的内容：

```text
不要上传的内容
小红书商业合作
```

这些目录下的文件不会进入 `content/`，也不会出现在网站目录或下载包里。

## 常用命令

安装依赖：

```bash
npm install
```

本地开发：

```bash
npm run dev
```

只同步内容：

```bash
npm run sync-content
```

校验同步结果：

```bash
npm run verify:sync
```

本地构建：

```bash
npm run build
```

同步、校验、构建并部署到 Vercel：

```bash
npm run sync:deploy
```

只跑完整流程但不部署：

```bash
DEPLOY=0 scripts/sync-and-deploy.sh
```

## 同步流程

`scripts/sync-content.mjs` 会执行：

1. 扫描内容源目录中的 `.pdf` 和 `.png` 文件。
2. 跳过 `不要上传的内容` 和 `小红书商业合作`。
3. 为每个文件生成稳定 ID 和 SHA-256 校验值。
4. 复制文件到 `content/`。
5. 为 PDF 或 PNG 生成预览图到 `public/previews/`。
6. 生成 `src/data/content-manifest.json`。

`scripts/verify-sync.mjs` 会校验：

1. 源目录可上传文件数量与 manifest 一致。
2. 排除目录没有泄漏到 manifest。
3. 源文件、已复制文件和 manifest 中的 checksum 一致。
4. 万能码和专栏码环境变量存在。
5. 专栏码对应的专栏在 manifest 中存在。

## 下载权限

下载权限由环境变量控制，真实值不要提交到 GitHub。

需要配置的变量：

```bash
INVITE_CODES_ALL=
INVITE_CODES=
INVITE_CODES_STRATEGY_PRODUCT_INTRO=
INVITE_CODES_STRATEGY_PRODUCT_ADVANCED=
INVITE_CODES_RECOMMENDATION_PM=
SESSION_SECRET=
```

权限规则：

- `INVITE_CODES_ALL` 或 `INVITE_CODES`：万能码，可下载全部资料、任意专栏、任意单篇。
- `INVITE_CODES_STRATEGY_PRODUCT_INTRO`：只能下载「策略产品入门专栏」及其单篇。
- `INVITE_CODES_STRATEGY_PRODUCT_ADVANCED`：只能下载「策略产品进阶专栏」及其单篇。
- `INVITE_CODES_RECOMMENDATION_PM`：只能下载「推荐PM手把手入门专栏」及其单篇。
- `SESSION_SECRET`：用于签名下载权限 cookie。

本地环境变量放在 `.env.local`。Vercel 生产环境变量通过 Vercel 控制台或 `vercel env` 管理。

## 部署

项目已绑定到 Vercel 项目 `strategy-archive-site`。

生产部署命令：

```bash
npm run sync:deploy
```

这个命令会依次执行：

```bash
npm run sync-content
npm run verify:sync
npm run typecheck
vercel build --prod
vercel deploy --prebuilt --prod
```

## 自动任务

Codex 中的每日自动任务会以内容源目录为工作目录：

```bash
/Users/gongxin/Downloads/乱七八糟/自媒体内容整理
```

但实际调用项目脚本：

```bash
/Users/gongxin/Documents/Projects/strategy-archive-site/scripts/sync-and-deploy.sh
```

这样日常内容维护集中在资料目录，构建和部署仍由 Next.js 项目完成。

## GitHub

仓库地址：

https://github.com/bill-gx114/strategy-web

不要提交以下内容：

- `.env.local`
- `.vercel/`
- `node_modules/`
- `.next/`
- `promo-video/output/`
- `*.tsbuildinfo`

这些已经在 `.gitignore` 中排除。

## 当前内容统计

截至最近一次同步：

- 可上传文件：125 个 PDF
- 内容分类：9 个
- 已排除目录：`不要上传的内容`、`小红书商业合作`
