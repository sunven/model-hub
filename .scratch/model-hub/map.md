# Model Hub — 模型信息市场

Label: wayfinder:map
Status: complete

## Destination

一份可以直接开工的「Model Hub」MVP 产品规格与技术方案：明确目标用户与核心决策、模型 / 供应商 / 托管报价 / 推理等级 / 评测分数的数据口径、信息架构与四个核心视图（探索对比表、模型详情、并排对比、榜单）、数据来源与更新策略、技术架构与部署、数据合规与署名、验收标准。产出为文档 + 低保真原型，不含生产代码。

## Notes

- 目标用户：中文开发者 / 技术负责人，用于模型选型。
- 产品性质：只读信息市场，不做交易、账号、社区。
- 范围：文本 / 推理 LLM；模型版本为主、托管报价为子行；主流国际 + 中国厂商。
- 术语：见根目录 `GLOSSARY.md`；Model Version 为主实体，Offer 为供应商报价，Score 挂 Model Version；避免混用「模型 / 供应商 / 报价 / 分数」。
- 评测：站内只嵌入 Arena `text` + `webdev`（latest split；rating / rank / 置信区间；不跨榜比较），不做自定义总分；AA 只做外部链接，不调用 API、不展示 AA 分数；来源与日期必须可见。
- 数据姿态：免费公开数据 / API，定期快照；不可用或不允许嵌入则外链；首版不付费、不抓取。
- 发布形态：公开中文站点，中文 UI，USD 为主并折算 CNY；基础 SEO。
- 推理等级：models.dev 的 `reasoning_options` 已提供 `toggle` / `effort`（none、minimal、low、medium、high、xhigh、max、default）/ `budget_tokens` 等结构化数据；2026-10-26 快照中 8,940 条供应商 × 模型记录里有 6,806 条带该字段。不需要从零人工维护；归一化与展示口径由「推理等级的数据语义与展示口径」和「领域模型与跨源合并规则」决定。
- 推理等级展示口径（研究建议）：effort 是模型特定子集，不是全局八级；toggle 通常是唯一关闭方式，非空选项中约 43.5% 没有明确关闭项；建议探索表用「可调 / 固定 / 未知」，详情 / 对比保留原始档位 + 预算范围，不压成统一 L1–L4（最终由「领域模型与跨源合并规则」和「信息架构与核心交互」决定）。
- models.dev 初查（2026-10-26）：232 个供应商、8,940 条供应商 × 模型记录，去重后 606 条模型级记录、约 508 个文本 canonical 模型；字段含 `canonical_model_id`、`cost`（含 context tiers）、`limit`、`status`、`reasoning_options`、`modalities`、`open_weights`、`knowledge`。MIT 许可，可作为主数据底座。
- 评测数据源（2026-10-26 研究结论）：Arena 官方 HuggingFace `lmarena-ai/leaderboard-dataset` 为 CC BY 4.0，可嵌入但需署名；arena.ai 网站本身 403 且禁止抓取。Artificial Analysis 免费 API 可用，但 Data Platform Terms v1.1 禁止把原始数据嵌入面向客户的产品，也禁止用于模型 / 供应商选择指导；首版只外链，除非取得书面许可。AA 的取舍已由「评测数据源组合与 AA 授权策略」决定：本 effort 只外链，不申请许可；书面许可留到 MVP 验证后再评估。
- 跨源身份：没有公共主键；models.dev `canonical_model_id` 最适合作为中心键，AA 用 UUID，Arena 用 name + organization；需要人工维护 crosswalk，不能仅靠名称模糊匹配（见「领域模型与跨源合并规则」）。
- 工作方式：每个会话最多解决一张非 research 票；grilling 票同时调用 grilling + domain-modeling；research 票由子代理调用 research；prototype 票调用 prototype。
- 本地 tracker：`.scratch/model-hub/`；当前目录不是 git 仓库，research 产出写 `.scratch/model-hub/research/`，不建分支。
- 本 effort 的执行只到规格与原型，不写生产代码；由「汇编 MVP 规格与技术方案」收口。
- 已交付：`spec.md`（2026-10-27，615 行）；本 effort 结束，实现阶段另开 effort / 票。
- 视觉方向：A · Workbench（左栏筛选 + 密集表）；原型资产在 `.scratch/model-hub/prototype/`，B Cards / C Editorial 已弃用。
- 工作标题：Model Hub（目录名 `model-hub`）；品牌命名不在本 effort 内。

## Decisions so far

<!-- 关闭的票在这里追加一行：- [票名](issues/NN-slug.md): 一句话结论 -->

- [数据源可得性、授权与字段](issues/01-data-source-feasibility.md): models.dev（MIT）做主数据；Arena 用 HF CC BY 4.0 数据集嵌入并署名；AA 条款禁止站内嵌入 / 用于选型指导，首版只外链；跨源身份需人工 crosswalk。
- [推理等级的数据语义与展示口径](issues/02-reasoning-levels.md): `reasoning_options` 不是统一八级；effort 是模型特定子集，toggle 常是唯一关闭方式；建议表格用「可调 / 固定 / 未知」，详情保留原始档位 + 预算，不压成 L1–L4。
- [评测数据源组合与 AA 授权策略](issues/12-eval-source-mix-and-aa-licensing.md): AA 只外链、不调用 API、不展示分数，许可留到 MVP 验证后；站内评测只用 Arena `text` + `webdev`（latest，rating / rank / 置信区间，不跨榜比较）；LiveBench / SWE-bench 首版不纳入。
- [领域模型与跨源合并规则](issues/03-domain-model-and-merge.md): 模型版本为主、Offer 为辅；Score 挂模型版本 × 来源 × 榜单 × 条件；status=null 视为「可用（未标记）」；人工 crosswalk + override 层，不做模糊匹配。
- [评测指标与缺失数据策略](issues/04-eval-metrics-and-missing-data.md): 只用 Arena `text` + `webdev` 的 rating + 置信区间 + rank，不跨榜、不做速度 / 散点；表一行 / 榜多行，缺失显示「未收录」并沉底；默认按 text rating 排序。
- [收录规则与首批模型清单](issues/05-inclusion-rules-and-launch-set.md): 首批 43 个 Model Version / 20 个实验室；beta / alpha 收、deprecated-only 不收、不要求 Arena 覆盖；清单见 [launch-set.md](launch-set.md)；白名单实验室新模型每日自动进入。
- [信息架构与核心交互](issues/06-information-architecture.md): 表为首页；左侧筛选 + 移动抽屉；详情决策优先；对比托盘 + `/compare`（最多 3 个）；榜单独立页（text / webdev，前 50）；移动卡片；USD 主 + CNY 次；无热门 / 编辑推荐。
- [核心页面低保真原型与视觉方向](issues/07-low-fi-prototype.md): 用户选择 A · Workbench（左栏筛选 + 密集表）；B Cards / C Editorial 丢弃；原型资产在 `prototype/`；四个视图与移动端已验证。
- [数据管道与更新策略](issues/08-data-pipeline-and-refresh.md): 静态 JSON + 每日 CI（03:30 UTC）；Arena 按 category / 最新日期 / 最高票过滤；校验后原子晋级，失败保留 last good；override 文件带审计；latest + 30 天 CI artifact，无数据库。
- [技术栈、部署与 SEO 基线](issues/09-tech-stack-deployment-seo.md): Next.js 15 静态导出 + TypeScript + Tailwind / Radix / TanStack Table；Cloudflare Pages；客户端筛选 / URL 状态；模型页与榜单 SSG 可索引，compare / 筛选 noindex；无后端 / DB / 分析；Lighthouse ≥90。
- [数据合规、署名与外链策略](issues/10-data-compliance-and-attribution.md): 页脚 + `/about` 覆盖 MIT / CC BY 4.0 署名与修改说明；AA 只外链；外链新窗口且引用不加 nofollow；纠错走 GitHub Issues（仓库 URL 上线前补）；CNY 用手动 `fx.yml`，超 14 天隐藏；无账号 / cookie / 分析。
- [汇编 MVP 规格与技术方案](issues/11-assemble-mvp-spec.md): [spec.md](spec.md) 已生成（615 行）；一致性检查通过；`/about` 与 `fx.yml` 两个遗漏已补；可进入实现。

## Not yet specified

暂无——当前能看见的在范围决策都已落票；「汇编 MVP 规格与技术方案」会做最后一致性检查，若发现新问题再开票。

## Out of scope

- 交易、支付、API 开通、密钥管理、充值：超出只读信息市场的定位，涉及账号、支付与合规。
- 用户账号、收藏、评论、社区评分、UGC：首版不引入社区冷启动与内容治理。
- 多模态模型（图像 / 音频 / 视频 / embedding / reranking）进入 MVP：首版只做文本 / 推理 LLM，后续另开 effort。
- 自建评测、实时 latency 基准、模型托管：只展示第三方评测，不自己跑分。
- AA 站内数据 / API 集成：本 effort 只外链，不调用 AA API、不展示 AA 分数；书面许可留到 MVP 验证后。
- Arena 的 agent / text_style_control 等其余子集：首版只嵌入 text + webdev。
- LiveBench、SWE-bench 等补充评测源：首版不纳入。
- 成本计算器、按任务推荐、模型选型助手：首版只做信息比较，不做推荐算法。
- 排名历史趋势、提醒、订阅、邮件推送：首版只保留最新快照。
- 英文版 / 多语言：首版中文优先。
- 品牌命名、VI、完整设计系统：原型只定低保真方向。
- 生产代码、部署上线、持续运维：本 effort 只到规格与原型。
- 付费数据源、网页抓取、绕过反爬：首版默认不付费、不抓取；是否向 AA 申请书面许可见「评测数据源组合与 AA 授权策略」。
- 移动端 App、第三方 API、商业化 / affiliate：超出 MVP。
- 独立供应商页、公司页、模型家族页：首版用探索表筛选 + 模型详情覆盖。
- 全量 models.dev 模型：首版只覆盖精选主流文本 / 推理模型。
