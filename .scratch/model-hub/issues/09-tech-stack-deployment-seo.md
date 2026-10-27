# 技术栈、部署与 SEO 基线

Type: grilling
Status: resolved
Blocked by: 06, 08

## Question

用哪套技术栈实现四个视图和静态数据管道，部署在哪里，才能兼顾开发速度、中文访问稳定性、表格 / 图表体验和基础 SEO？

需要定下：

- **框架与渲染**：Next.js / Astro / Vite + React 等；SSG / ISR / CSR 的选择；是否需要服务端。
- **UI**：表格（TanStack Table）、图表（Recharts / visx / ECharts）、组件库、中文排版、暗色模式是否首版。
- **搜索 / 筛选**：客户端还是服务端；数据量上限与性能。
- **部署**：Vercel / Cloudflare Pages / 国内云；面向中国大陆的访问稳定性、域名 / 备案是否需要；构建与定时同步如何跑。
- **SEO**：模型详情页的静态路由、metadata、sitemap、robots、结构化数据、OG 图；对比 / 筛选页是否 noindex。
- **质量基线**：可访问性、移动端、Lighthouse 目标、错误监控 / 分析（最小化，注意隐私）。
- **明确不引入的东西**：账号、数据库（若不必要）、CMS、复杂状态管理。

约束：静态快照、只读、中文公开站点；以「信息架构与核心交互」和「数据管道与更新策略」为输入。产出是可直接写进规格的技术方案。

## Answer

**决定（2026-10-27）**

### 1. 框架与渲染

- **Next.js 15 App Router + TypeScript**，`output: "export"` 静态导出；不启用服务端 / ISR。
- 模型详情页、榜单页全部 SSG：`generateStaticParams` + `dynamicParams = false`；探索表 / 对比页为静态壳 + client components。
- 构建时读取 `data/latest/*.json`，不在构建时抓源；43-500 个模型的筛选 / 排序 / 搜索全部客户端完成，不建 API。
- 路由：
  - `/` 探索表
  - `/models/[lab]/[model]` 模型详情
  - `/compare?models=...` 并排对比
  - `/leaderboards` → 静态托管重定向到 `/leaderboards/text`；`/leaderboards/[board]`
  - 未知模型 / 未知 board 走 404。
- 静态导出注意：使用 `useSearchParams` 的客户端筛选组件包 `Suspense`；动态路由必须全部预生成。

### 2. UI 与状态

- **Tailwind CSS + Radix primitives + TanStack Table**；按 A · Workbench 原型实现。
- 不引图表库、不引完整设计系统；浅色主题 only，CSS variables 保留未来暗色可能。
- 中文字体用系统栈（PingFang SC / Hiragino / Microsoft YaHei），不加载 CJK web font。
- 筛选 / 排序 / 搜索写 URL query；对比托盘用 React context；对比页用 `models=` query 可分享。
- 不引全局状态库、SWR / React Query、CMS、数据库、auth、后端。
- 移动端沿用卡片列表 + 筛选抽屉；表格语义、键盘可达、焦点可见。

### 3. 托管与部署

- **Cloudflare Pages** 托管静态 `out/`；无服务器、无 ICP；中国大陆访问不稳定。
- 若大陆访问成为硬要求，静态产物可原样迁到国内云 + CDN（需域名 / ICP）；不改代码。
- GitHub Actions：
  - `data.yml`：每日 03:30 UTC + 手动触发，运行数据管道，成功后提交 `data/latest` + manifest。
  - `ci.yml`：PR / push 跑 typecheck、lint、build。
  - Cloudflare Pages 监听 main 构建 / 部署；PR 生成 Preview；数据提交触发重新部署。
- 静态托管用 `_redirects` 处理 `/leaderboards` → `/leaderboards/text`、尾斜杠与 404。
- 构建只消费已校验的 latest；数据失败时部署不更新。

### 4. SEO

- 可索引：`/`、全部模型详情页、`/leaderboards/text`、`/leaderboards/webdev`。
- noindex：`/compare`、带筛选 / 搜索 query 的探索页（canonical 指回 `/`）、榜单搜索态。
- 模型页 metadata：标题含模型名 + 价格 / 上下文 / 推理 / Arena；描述来自关键事实；canonical；OG / Twitter；`lang=zh-CN`。
- 构建时生成 sitemap：模型页 + 两个榜单；robots 允许；compare / filter 不入 sitemap。
- 结构化数据只放基础 `WebPage` + `BreadcrumbList`；不用 `AggregateRating` / `Review`，不把 Arena rating 伪装成商品评分。
- MVP 用通用站点 OG 图；逐模型 OG 留到后续。
- 中文单语；英文 slug；不需要 hreflang。

### 5. 质量基线

- Lighthouse 目标：模型详情页 / 榜单移动端 Performance、Accessibility、SEO ≥ 90。
- TypeScript strict；ESLint；build 必须通过；无 console error。
- 无障碍：语义化 table、键盘操作、焦点可见、Radix 可访问组件；axe smoke。
- 首版不做分析；后续可加 Plausible / Umami，隐私优先。
- 明确不做：暗色模式、图表、搜索服务、账号、服务端、API、CMS。

### 6. 建议目录

```
app/
  page.tsx
  models/[lab]/[model]/page.tsx
  compare/page.tsx
  leaderboards/[board]/page.tsx
components/
lib/
data/latest/
data/overrides/
data/crosswalk/
data/schema/
scripts/
public/
```

## Consistency addendum（2026-10-27）

- `/about` 数据说明 / 许可 / 隐私 / 纠错页由合规票要求，补入静态路由与 sitemap（indexable）；`data/fx.yml` 由展示层读取。
