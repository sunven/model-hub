# Model Hub — MVP 产品规格与技术方案

- 版本：1.0
- 日期：2026-10-27
- 状态：可进入实现（本 effort 不写生产代码）
- 决策基线：`.scratch/model-hub/map.md` 与其中 11 张已关闭的决策 / 研究 / 原型票 + 本规格
- 配套资产：
  - [Wayfinder 地图](map.md)
  - [术语表](../../GLOSSARY.md)
  - [首批模型清单](launch-set.md)
  - [低保真原型](prototype/index.html)（说明见 [prototype/README.md](prototype/README.md)）
  - 研究笔记：[数据源](research/01-data-source-feasibility.md)、[推理等级](research/02-reasoning-levels.md)

本规格把已关闭票的结论汇编成可直接开工的产品与技术方案。若本文件与单张票冲突，以本文件的“一致性检查”结论为准；未覆盖的细节回到对应票。本 effort 只交付规格与原型，不写生产代码。

---

## 0. 一页摘要

**一句话**：面向中文开发者的只读模型信息市场——用同一张表比较模型版本的价格、上下文、推理等级和 Arena 偏好评分，并明确数据来源、日期与缺失。

**目标用户**：中文开发者 / 技术负责人，为项目做模型选型，权衡能力、价格、上下文与推理控制。

**核心差异**：
- 模型版本为主、托管报价为子行：先判断模型，再判断在哪买更便宜。
- Arena `text` / `webdev` 分源展示，不做自定义综合分；AA 只外链。
- 推理等级保留厂商原始档位，不压成虚假的统一 L1–L4。
- 缺失数据明确标注「未收录」，不插补、不伪装成差。
- 中文优先、公开可索引、来源与许可透明。

**MVP 范围**：43 个首批 Model Version / 20 个实验室；探索表、模型详情、并排对比、Arena 榜单四个视图；AA 外链；中文单语；公开静态站点。

**明确不做**：交易、账号、社区、多模态、自建评测、成本计算器、任务推荐、历史趋势、英文版、供应商/家族页、自定义列、图表、speed/TTFT、暗色模式、分析、后端/数据库、AA 站内数据、抓取。

---

## 1. 产品定义

### 1.1 目标用户与任务

| 维度 | 定义 |
|---|---|
| 用户 | 中文开发者、技术负责人、独立开发者 |
| 场景 | 为项目选模型；比较价格 / 上下文 / 推理控制 / Arena 强弱 |
| 核心任务 | 筛选 → 理解 → 并排比较 → 判断 |
| 非目标用户 | 企业采购、普通消费者、模型研究者（可作为旁观用户，但不为他们的工作流设计） |

### 1.2 产品原则

1. **来源忠实**：Arena rating 是偏好评分，不叫 Elo、不当准确率；不跨 Board 比较；不合成自定义总分。
2. **模型优先**：页面主实体是 Model Version；Offer 是供应商报价；Score 挂 Model Version。
3. **市场可见**：同一模型的不同供应商报价保留差异；gateway 默认折叠，不淹没第一方/云平台。
4. **缺失诚实**：没有分数显示「未收录」，没有价格显示「未公布」，不插补、不排序成 0。
5. **可追溯**：每个关键区块带来源与日期；manifest 记录快照；override 有审计。
6. **中文优先**：中文 UI、中文文案、英文稳定 slug；不做多语言。
7. **静态优先**：所有数据在构建时固化；无账号、无后端、无数据库、无分析。
8. **合规前置**：models.dev MIT、Arena CC BY 4.0、AA 只外链；不使用第三方 logo。

### 1.3 MVP 成功标准（验收导向）

- 用户能在 5 个核心场景内完成选型动作（见 §8）。
- 所有展示的评测分数、价格、状态都能追溯到来源与快照日期。
- 缺失、beta/alpha、deprecated-only、gateway 折叠等边界状态都有明确 UI。
- 公开页面可被搜索引擎抓取；许可与署名完整；无未授权数据。

---

## 2. 已锁定决策索引

| 主题 | 结论 | 票 |
|---|---|---|
| 数据源与许可 | models.dev 主数据（MIT）；Arena HF 可嵌入（CC BY 4.0）；AA 只外链 | [数据源](issues/01-data-source-feasibility.md) |
| 推理等级 | 保留 toggle / effort / budget 原始形态；不压统一等级 | [推理等级](issues/02-reasoning-levels.md) |
| 领域模型 | Model Version 为主、Offer 为辅；Score 挂 Model Version；人工 crosswalk + override | [领域模型](issues/03-domain-model-and-merge.md) |
| 评测口径 | Arena `text` + `webdev`；rating + CI + rank；不跨榜、不聚合档位 | [评测指标](issues/04-eval-metrics-and-missing-data.md) |
| 首批范围 | 43 个 Model Version / 20 实验室；beta/alpha 收，deprecated-only 不收 | [收录规则](issues/05-inclusion-rules-and-launch-set.md) |
| 信息架构 | 表为首页；左栏筛选；详情决策优先；对比托盘；榜单独立 | [信息架构](issues/06-information-architecture.md) |
| 视觉方向 | A · Workbench（左栏筛选 + 密集表） | [原型](issues/07-low-fi-prototype.md) |
| 数据管道 | 静态 JSON + 每日 CI；原子晋级；last good；override 审计 | [管道](issues/08-data-pipeline-and-refresh.md) |
| 技术栈 | Next.js 15 静态导出；TS；Tailwind / Radix / TanStack Table；Cloudflare Pages | [技术栈](issues/09-tech-stack-deployment-seo.md) |
| 合规 | 页脚 + `/about`；MIT / CC BY 署名；AA 外链；手动 FX；GitHub Issues 纠错 | [合规](issues/10-data-compliance-and-attribution.md) |
| 评测源组合 | AA 只外链；Arena 只用 text + webdev；LiveBench / SWE-bench 首版不纳入 | [评测源](issues/12-eval-source-mix-and-aa-licensing.md) |

---

## 3. 领域模型与数据契约

术语以根目录 [GLOSSARY.md](../../GLOSSARY.md) 为准。核心实体：**Model Family / Model Version / Provider / Offer / Score / Source / Snapshot / Crosswalk / Override**。

### 3.1 实体与关系

| 实体 | 说明 | 关键关系 |
|---|---|---|
| ModelFamily | 同源模型版本的集合（Claude / GPT / Gemini / Qwen） | 可选分组；不参与身份键 |
| ModelVersion | canonical lab/model 身份的模型版本；模型页主实体 | 1:N Offer；1:N Score |
| Provider | 托管组织；kind = first_party / cloud / gateway | 1:N Offer |
| Offer | Provider × ModelVersion 的一次上架 | 价格 / 上下文 / 推理选项 / 状态 |
| Score | ModelVersion × Source × Board × Condition × Snapshot 的一条评分 | 只属于 ModelVersion，不属于 Offer |
| Source | models.dev / Arena HF / manual | 许可、署名、URL |
| Snapshot | 某次抓取固化的数据版本 | manifest / source refs |
| Crosswalk | 跨来源身份映射 | 人工维护，允许未匹配 |
| Override | 带审计的人工修正 | 构建时叠加，不改源数据 |

### 3.2 身份与合并

- **ModelVersion ID**：`mv_` + canonical_model_id 的 slug；canonical 缺失时用 `mv_` + provider + provider_model_id；冲突加后缀。ID 稳定、展示名可变。
- **Canonical Model ID**：models.dev 的 `lab/model`；canonical 不同 = 不同 Model Version。日期快照、provider 别名、推理档位挂在同一版本下；推理档位是 Condition，不是新模型。
- **Offer ID**：`of_` + provider_id + `__` + provider_model_id；provider_model_id 变化则新建 Offer，旧 Offer 标记 deprecated。
- **Score ID**：`sc_` + source + board + condition + model_version_id + snapshot_date。
- **No fuzzy merge**：canonical 缺失、Arena name/org 匹配、AA 外链匹配全部走人工 Crosswalk；匹配不上保留为 Unmatched Entry。
- **Family**：仅可选分组属性；首版不做家族页。
- **Offer.providerKind 相对模型实验室**：第一方 = 该 lab 自己的平台（Amazon Nova on Bedrock、Gemini on Vertex、ByteDance on Volcengine）；其他主要云平台 = cloud；其余 = gateway。避免 Nvidia / Alibaba 托管别家模型时被标成第一方。
- **Offer 去重**：同 provider + price + limits + status 的重复行合并，保留推理选项最完整的一行；区域价格差异保留为独立 Offer。

### 3.3 状态与可用性

来源 `status` 映射：

| 源 status | Offer status | 展示 | 默认可见 |
|---|---|---|---|
| null | available_unmarked | 可用（未标记） | 是 |
| beta | beta | Beta | 是（带徽标） |
| alpha | alpha | Alpha | 是（带徽标） |
| deprecated | deprecated | 已弃用 | 否（默认折叠） |

ModelVersion `availability` 派生：

| 条件 | availability | 展示 |
|---|---|---|
| ≥1 个非 deprecated Offer | available | 可用 |
| 全部 Offer deprecated | deprecated | 已弃用（不进探索表） |
| 部分 deprecated、部分可用 | mixed | 混合（标注部分供应商已弃用） |
| 无 Offer 且 open_weights | open_weights_only | 可自托管 |
| 无 Offer 且无开源信息 | unknown | 状态未知（首版不进目录） |

beta / alpha 是模型页 badge，不改变 availability 取值。

### 3.4 价格与汇率

- Offer 保存原始字段：`input / output / cache_read / cache_write / tiers / currency / source / last_verified / status`；另存 limits 与原始推理选项。
- 价格以源币种存储（models.dev 为 USD）；CNY 只在展示层折算，不落库。
- 模型页价格摘要：分 input / output 显示区间或最低价；只统计第一方 + 云平台（gateway 折叠）；若没有第一方 / 云平台，则使用 gateway 并标「仅网关」；不做 blended price。
- 缺失价格 = 「未公布」，不是 $0；价格 0 = 「免费」；无 Offer + open_weights = 「可自托管」。
- 上下文阶梯价保留 `tiers`，不压平；batch / audio 字段保留但不进首版对比表。
- CNY：`data/fx.yml` 提供 `usd_to_cny` / `as_of`；每周人工复核；超过 14 天隐藏 CNY；页面显示汇率与日期。

### 3.5 推理等级

- 保存原始 `reasoning_options`：`toggle` / `effort.values`（none、minimal、low、medium、high、xhigh、max、default）/ `budget_tokens`（min / max，含异常 -1）。
- **不压成全局 L1–L4**；effort 是模型特定子集；toggle 通常是唯一关闭方式；约 43.5% 的非空选项没有明确关闭项。
- 探索表 pill 使用四态：**可调（N 档）/ 固定 / 未标档 / 不支持**；详情 / 对比展示原始档位 + 预算范围。
- ModelVersion 存一个派生 `reasoningLabel` 供表格使用；详情读 Offer 的原始选项。
- 多 Offer 合并取并集并记录来源；don't 断言「始终开启」，只能写「未见关闭选项」。

### 3.6 评测分数

- 只嵌入 Arena `text` + `webdev`；text 取 `category=overall`，webdev 取 `category=webdev`。
- 字段：`rating / ci_low / ci_high / rank / votes / condition / snapshot_date / source_ref`。
- 同模型多个条件 = 多条 Score；不聚合、不取最高分；不跨 Board 比较。
- 探索表每个模型每榜一行：优先 base / 无档位；否则取 vote_count 最高；档位标签可见；详情显示全部条件。
- 榜单保留全部原始行（含多条件、未匹配）；未匹配标「未匹配」，不链模型页。
- AA 不是 Score 来源；ModelVersion 只存可空 `aa_url`；无 URL 回退 AA 总榜。

### 3.7 输出文件

| 文件 | 内容 |
|---|---|
| `data/latest/models.json` | ModelVersion 数组（含 family、availability、release badges、sourceRefs） |
| `data/latest/offers.json` | Offer 数组（价格、limits、capabilities、status） |
| `data/latest/scores.json` | Score 数组（Arena text / webdev） |
| `data/latest/unmatched.json` | 未能映射到 ModelVersion 的 Arena 行 |
| `data/latest/manifest.json` | 快照 ID、来源、时间、ETag / hash、计数、FX、override hash、校验状态 |
| `data/latest/validation-report.json` | 硬失败 / warnings / 统计 |
| `data/fx.yml` | USD→CNY rate / as_of / source（手动） |
| `data/launch-set.yml` | 43 个首批 ModelVersion 白名单与理由 |
| `data/crosswalk/*.yml` | Arena / AA / canonical 映射 |
| `data/overrides/*.yml` | 人工修正（带审计） |
| `data/schema/*.json` | JSON Schema |

示例（数值来自 2026-10-26 快照，仅示意）：

```json
{
  "id": "mv_anthropic_claude-opus-5-5",
  "canonicalModelId": "anthropic/claude-opus-5-5",
  "name": "Claude Opus 5.5",
  "lab": "Anthropic",
  "family": "claude-opus",
  "releaseDate": "2026-09-22",
  "knowledgeCutoff": "2026-06",
  "modalities": { "input": ["text", "image", "pdf"], "output": ["text"] },
  "openWeights": false,
  "aaUrl": null,
  "availability": "available",
  "releaseBadges": [],
  "reasoningLabel": "可调 5 档",
  "sourceRefs": ["models.dev:anthropic/claude-opus-5-5"],
  "snapshotId": "2026-10-27T03:30:00Z-abc123"
}
```

```json
{
  "id": "of_anthropic_claude-opus-5-5",
  "modelVersionId": "mv_anthropic_claude-opus-5-5",
  "providerId": "anthropic",
  "providerKind": "first_party",
  "providerModelId": "claude-opus-5-5",
  "status": "available_unmarked",
  "price": { "input": 4, "output": 20, "cacheRead": 0.5, "cacheWrite": null, "currency": "USD", "tiers": [] },
  "limits": { "context": 1000000, "output": 128000 },
  "capabilities": { "reasoning": true, "reasoningOptions": [{ "type": "effort", "values": ["low", "medium", "high", "xhigh", "max"] }], "toolCall": true, "structuredOutput": true }
}
```

```json
{
  "id": "sc_arena_text_high_anthropic-claude-opus-5-5_2026-10-22",
  "modelVersionId": "mv_anthropic_claude-opus-5-5",
  "source": "arena_hf",
  "board": "text",
  "condition": "High",
  "rating": 1516.2,
  "ciLow": 1509.4,
  "ciHigh": 1523.0,
  "rank": 2,
  "votes": 10322,
  "snapshotDate": "2026-10-22"
}
```

### 3.8 Override 与 Crosswalk

- Override 字段：`target_type / target_id / field / value / reason / author / created_at / source_url`。
- 允许覆盖：crosswalk、AA 外链、provider kind、推理等级展示标签、价格 / 状态纠错、family / 别名。
- 源数据默认权威；override 在归一化后叠加；同一字段冲突写入 validation report；结构错误硬失败，质量 warning。
- Crosswalk 人工维护，不自动模糊匹配；未匹配保留。

---

## 4. 数据源与管道

### 4.1 来源矩阵

| 来源 | 访问 | 许可 | 用途 | 更新 | 策略 |
|---|---|---|---|---|---|
| models.dev | `/catalog.json` 或 `/api.json` + `/models.json` | MIT | 模型 / 价格 / 限额 / 推理 / 模态 | 近实时 | 每日快照，嵌入 |
| Arena HF | `text/latest` + `webdev/latest` Parquet | CC BY 4.0 | text / webdev ratings | 约每日 | 每日快照，嵌入 + 署名 |
| Artificial Analysis | 公开页面 | 仅外链 | 外部参考 | 不抓取 | 只外链，不调用 API、不展示分数 |
| FX | `data/fx.yml` | 人工 | CNY 折算 | 每周复核 | 手动 rate + date，超 14 天隐藏 |

### 4.2 管道步骤

1. **Fetch**：HTTP 超时 + 指数退避；ETag / If-None-Match；保存原始响应。
2. **Normalize models.dev**：建 ModelVersion / Offer；过滤文本输出；套用 launch-set；deprecated-only 隐藏；beta/alpha 保留；provider kind；价格 / limits / reasoning 归一。
3. **Normalize Arena**：按 Board 过滤 category；按 model/org/condition 分组；选最新 `leaderboard_publish_date`，同日期取最高 `vote_count`；保留 unmatched；生成 Score。
4. **Apply crosswalk / overrides / fx**：人工映射与修正；FX 原样写入 manifest。
5. **Validate**：JSON Schema；引用完整性；业务规则；Arena category/date；重复 Score；价格 / context 合理性；override target；manifest 一致性。
6. **Atomic promote**：写临时快照；校验通过才替换 `data/latest`；失败保留 last good，CI 失败并通知。
7. **Build / Deploy**：静态站点只读 latest；数据提交触发 Cloudflare Pages 部署。

### 4.3 调度与失败

- GitHub Actions 每日 03:30 UTC + `workflow_dispatch`；models.dev / Arena 每日一次；AA 不抓。
- 抓取失败 / 校验失败：latest 不变；CI 失败；站点继续用 last good。
- stale：models.dev >48h、Arena >72h 显示 stale warning；不隐藏数据。
- 长期不可用：Arena 隐藏评分区或保留最后日期并标注；AA 始终外链；不发布半套数据。
- 保留：latest 在仓库 / 站点；原始 + 归一化快照作为 CI artifact 保留 30 天；不做历史库 / 历史 UI。

### 4.4 首批收录与维护

- 首批 43 个 Model Version / 20 实验室，清单见 [launch-set.md](launch-set.md)。
- 纳入：文本输出 LLM；beta/alpha 收；deprecated-only 不收；至少一个 Offer 或 `open_weights=true`；不要求 Arena 覆盖。
- 供应商：第一方 + 主要云平台；gateway 默认折叠；仅 gateway Offer 的模型例外并标注。
- 每实验室 2-4 个当前主力；MiniMax / Baidu 暂不纳入（当前第一方主力 deprecated 或仅网关报价）。
- 维护：白名单实验室内符合规则的新模型每日自动进入；deprecated-only 从列表隐藏；新实验室 / provider 人工加白名单；每周检查 crosswalk / AA 外链 / 异常。

### 4.5 校验规则

**硬失败**：必填字段缺失、类型错误、引用不存在的 model/provider、Arena 未按 category 过滤、重复 Score、价格/context 为负、manifest 与实际文件不一致、schema 校验失败。

**Warning**：无价格、无 Arena、context 异常、override target 不存在、未匹配行数量异常、价格离群、FX 过期。

**可复现**：相同 raw snapshot + overrides 的业务数据字节级稳定（manifest 时间除外）；排序、数字格式固定。

---

## 5. 信息架构与页面规格

### 5.1 全局

| 项 | 规格 |
|---|---|
| 顶部导航 | Model Hub 品牌；「模型」→ `/`；「榜单」→ `/leaderboards/text`；不设对比一级入口 |
| 页脚 | 数据来源 / 许可 / 更新时间 / 非官方 / 价格免责 / `/about` / 纠错入口 |
| 对比托盘 | 固定底部；已选 chips、n/3、清空、去对比；最多 3 个；compare 页隐藏 |
| 视觉 | A · Workbench：左栏筛选 + 密集表；浅色；系统中文栈；无图表 / 暗色 |
| 响应式 | 桌面左栏 + 表；移动端卡片 + 筛选抽屉；对比横向滚动；榜单紧凑列表 |
| 状态 | 无结果 / 无报价 / 无 Arena / 对比为空 / 榜单搜索无结果 / 404 均有明确文案与下一步 |
| 数据新鲜度 | 页脚 + 表格底部 + 详情区块小字；stale 提示；manifest 日期 |

### 5.2 探索表 `/`

**默认列**：Model（名称 + Lab + 状态 / 开源徽标）、Context、Price（USD input/output）、Reasoning、Arena text（rating + CI）、Arena webdev（rating + CI）。

**行为**：
- 行点击 → 详情；最左 checkbox → 对比；列头排序。
- 默认排序：Arena text rating 降序；缺失最后；并列按 rank → release date → name。
- 可切换：Arena webdev / newest / price / context。
- 搜索：模型名 / Lab / 家族 / 别名。
- 展示全部 43 个种子模型，不分页；未来增长再评估。
- 不分组；Lab 作为列内信息 + 筛选。

**筛选**（左栏桌面，移动端抽屉）：
- 实验室（多选）
- 托管商（「更多」；按是否有该 provider Offer 过滤）
- 输出价格上限（≤$1 / ≤$5 / ≤$15 / 不限）
- 最低上下文（32K / 128K / 256K / 1M）
- 支持推理
- 开源权重
- 仅稳定版
- 只看有评测
- 无模态筛选；输入模态在详情展示。
- 有筛选时显示 active chips + 清除全部；状态写 URL。

**Mobile**：卡片列表（Model、Lab、状态、价格、context、Arena text/webdev、加入对比）；筛选抽屉；排序 / 搜索保留。

### 5.3 模型详情 `/models/[lab]/[model]`

顺序：
1. Header：名称、Lab、canonical ID、status / availability / open weights 徽标、加入对比、AA 外链。
2. 关键事实：input/output 价格区间（USD + CNY）、context、output limit、reasoning、release / status。
3. 托管报价：Provider、kind、status、input/output/cache、context、reasoning options、来源 / 校验时间；默认按 output 价格升序；gateway / deprecated 默认折叠，可展开；缺失「未公布」；0「免费」；无 Offer + 开源「可自托管」。
4. Arena 评测：text / webdev 分开；rating + CI + rank + votes + condition + 快照日期；不聚合、不跨榜；无分数「Arena 未收录」+ 外链。
5. 能力与模态：输入/输出模态、tool call、structured output、knowledge cutoff、release date、open weights、license（有则显示，无则「未提供」）。
6. 外部评测：AA 外链卡片；不展示 AA 分数。
7. 来源与更新时间：页脚数据说明 + 区块级来源小字。
- 单页滚动，不用 tab；移动端全屏卡片。

### 5.4 并排对比 `/compare?models=...`

- 最多 3 个；从表格 checkbox / 详情「加入对比」；超过 3 个阻止并提示。
- 字段：名称/Lab/状态、input/output 价格区间（USD 主 + CNY 次）、context、reasoning、Arena text、Arena webdev、open weights、release、availability、AA 外链。
- 差异高亮但不判定赢家；缺失「—」；每列可移除 / 回详情；URL 可分享。
- 移动端横向滚动 + 固定字段列；空状态引导选择。
- 首版不从榜单直接加入对比。

### 5.5 榜单 `/leaderboards/text`、`/leaderboards/webdev`

- 两个独立 Board；默认 `/leaderboards` → text；board switcher。
- 默认前 50 + 搜索；「显示更多」每次 50；不无限滚动。
- 列：rank、Model（匹配则链接）、Lab/Organization、rating + CI、condition、votes。
- 未匹配行标「未匹配」，显示原始 name + org，不链模型；仍按 rank 展示。
- 来源 / 快照日期 / CC BY 4.0 署名在顶部或底部；不提供跨榜总排名。
- 移动端紧凑列表 / 卡片。

### 5.6 `/about` 数据说明

- 数据来源与许可：models.dev MIT（含版权 / 许可声明文本或链接）；Arena HF CC BY 4.0（署名、许可链接、修改说明）；AA 外部链接声明。
- 修改说明：按 category / 最新日期 / 最高票筛选；映射到 Model Version；币种折算；展示格式调整；未改变评分含义。
- 非官方 / 商标：不使用 logo；名称指称；无合作 / 背书。
- 价格 / 汇率免责；CNY 超 14 天隐藏说明。
- 隐私：无账号 / 评论 / cookie / 分析；静态托管商可能记录访问日志。
- 纠错 / 下架：GitHub Issues 链接 + 模板；仓库 URL 上线前补齐；权利方请求走同一入口。

### 5.7 URL 与状态

| 参数 | 含义 |
|---|---|
| `q` | 搜索词 |
| `labs` | 实验室多选，逗号分隔 |
| `maxOutput` | 输出价格上限（USD） |
| `minContext` | 最低上下文 |
| `reasoning` / `openWeights` / `stableOnly` / `hasArena` | 1/0 开关 |
| `sort` | `arena_text` / `arena_webdev` / `newest` / `price` / `context` |
| `models` | compare 页选中的 1-3 个 slug |
| `board` | `text` / `webdev` |
| `lbq` | 榜单搜索词 |

筛选 / 排序用 `replaceState`；详情 / 榜单 / 对比导航用 `pushState`；返回保留状态。

### 5.8 文案与数字

- 中文标签：模型、实验室、托管商、上下文、推理、开源权重、未收录、未匹配、未公布、可自托管。
- 上下文：128K / 1M；rating 1 位小数；CI 用 ± 或区间；日期 YYYY-MM-DD；金额千分位。
- 不使用「Elo」「准确率」「综合分」；使用「Arena rating（偏好评分）」。
- 不把缺失称为「差」；不宣称显著性。

---

## 6. 技术方案

### 6.1 栈

| 层 | 选择 |
|---|---|
| 框架 | Next.js 15 App Router + TypeScript |
| 渲染 | `output: "export"` 静态导出；模型 / 榜单 SSG；探索 / 对比静态壳 + client components |
| UI | Tailwind CSS + Radix primitives + TanStack Table |
| 状态 | URL query + React context（对比托盘）；无全局状态库 |
| 数据 | 构建时 import `data/latest/*.json`；无 API / DB / CMS |
| 部署 | Cloudflare Pages；GitHub Actions |
| SEO | metadata / canonical / sitemap / robots；通用 OG |
| 质量 | TS strict、ESLint、build、Lighthouse ≥90 |

### 6.2 路由与渲染

| 路由 | 渲染 | 索引 |
|---|---|---|
| `/` | 静态壳 + client 筛选 | 可索引；带筛选 query noindex，canonical → `/` |
| `/models/[lab]/[model]` | SSG（`generateStaticParams`，`dynamicParams=false`） | 可索引 |
| `/compare` | 静态壳 + client | noindex |
| `/leaderboards/[board]` | SSG（text / webdev） | 可索引；搜索态 noindex |
| `/about` | SSG | 可索引 |
| 未知路径 | 404 | noindex |

- `useSearchParams` 组件包 `Suspense`；所有模型 / board 预生成；未知模型 404。
- `/leaderboards` → `/leaderboards/text` 用 `public/_redirects`。

### 6.3 目录建议

```
app/
  page.tsx
  models/[lab]/[model]/page.tsx
  compare/page.tsx
  leaderboards/[board]/page.tsx
  about/page.tsx
  not-found.tsx
components/
  model-table.tsx
  filters.tsx
  score-cell.tsx
  offer-table.tsx
  compare-tray.tsx
  leaderboard.tsx
  badges.tsx
lib/
  data.ts
  format.ts
  filters.ts
  seo.ts
data/
  latest/
  launch-set.yml
  fx.yml
  crosswalk/
  overrides/
  schema/
scripts/
  fetch-models-dev.ts
  fetch-arena.ts
  normalize.ts
  validate.ts
  build-snapshot.ts
public/
  og.png
  _redirects
```

### 6.4 CI / 部署

- `data.yml`：每日 03:30 UTC + 手动；跑管道；成功后提交 `data/latest` + manifest。
- `ci.yml`：PR / push 跑 typecheck、lint、build。
- Cloudflare Pages：监听 main 构建 / 部署；PR Preview；数据提交触发重新部署。
- 构建只读已校验的 latest；源失败不部署新数据；无 secrets 进入客户端。
- 自定义域名 / ICP：首版用 Cloudflare Pages；大陆访问成为硬要求时迁国内静态托管 + CDN。

### 6.5 SEO

- 可索引：`/`、模型详情、两个榜单、`/about`。
- noindex：`/compare`、带筛选 / 搜索 query 的探索页、榜单搜索态。
- 模型页标题：`{name} — 价格、上下文、推理等级与 Arena 评分 | Model Hub`；描述来自关键事实；canonical；OG / Twitter；`lang=zh-CN`。
- sitemap：`/`、模型页、两个榜单、`/about`；robots 允许；compare / filter 不入 sitemap。
- 结构化数据：基础 `WebPage` + `BreadcrumbList`；不用 `AggregateRating` / `Review`，不把 Arena rating 伪装成商品评分。
- 通用 OG 图；逐模型 OG 后续再做。
- 中文单语；英文 slug；不需要 hreflang。

### 6.6 性能 / 可访问性

- Lighthouse 目标：模型详情 / 榜单移动端 Performance、Accessibility、SEO ≥90。
- 首屏无阻塞大图；系统字体；表格 / 卡片无 CLS；客户端 JS 只覆盖交互。
- 语义化 table、键盘可达、焦点可见、Radix 可访问组件；axe smoke。
- 无分析、无 cookie、无暗色模式、无图表库。

### 6.7 测试计划（实现阶段）

- 管道单测：Arena category / 日期 / 最高票；status / availability；价格摘要；override 叠加；validation 硬失败 / warning。
- 组件测试：筛选 / 排序 / URL 状态；对比最多 3；缺失 / 未匹配；报价折叠。
- E2E smoke：5 个场景；模型页 / 榜单 / `/about`；404；移动端。
- SEO / a11y：metadata、sitemap、noindex、Lighthouse、axe。
- 构建：typecheck、lint、build、静态导出完整性。

---

## 7. 合规、署名与隐私

### 7.1 页脚文案（建议）

> 模型与价格数据来自 [models.dev](https://models.dev)（MIT License）。Arena 评分来自 [LMArena Leaderboard Dataset](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset)（CC BY 4.0），我们按 category / 最新日期筛选并映射到模型版本。Artificial Analysis 仅提供外部链接。价格与汇率仅供参考，以供应商官网为准。本站非官方，模型与商标归各自所有者。[数据说明](/about)

### 7.2 许可

- **models.dev**：MIT；`/about` 保留版权 / 许可声明文本或链接；页脚署名。若贡献数据许可不清，上线前向维护者确认。
- **Arena HF**：CC BY 4.0；`/about` 署名 LMArena、链接许可、说明修改（category / 日期筛选、映射、展示格式、币种折算）；页脚与榜单页署名。
- **AA**：不嵌入数据、不调用 API、不展示分数；只放外部链接，标「外部评测」；不暗示合作 / 背书。
- **FX**：`data/fx.yml` 人工维护；显示 rate / as_of；超 14 天隐藏 CNY；不构成金融建议。

### 7.3 外链与商标

- 外链新窗口 + `rel="noopener noreferrer"`；引用来源不加 nofollow；未来付费 / 赞助链接再评估。
- 不使用第三方 logo / 图片；模型与供应商名只做名称指称。
- AA 有稳定模型 URL 则链模型页，否则回退总榜；失效链接降级。
- 页脚与 `/about` 放非官方声明；不用「官方」「合作」「认证」。

### 7.4 隐私与纠错

- 无账号、评论、cookie、分析；静态托管商可能记录访问日志，`/about` 说明。
- 纠错 / 下架：GitHub Issues + 模板（URL / 字段 / 当前值 / 建议值 / 来源）；仓库 URL 上线前必须补齐；若项目不公开，改为邮箱。
- 权利方请求同一入口；先隐藏、后核实；保留内部记录。
- 不抓取 arena.ai / AA，不绕过 403，不付费。

### 7.5 上线前复核

- 本规格不是法律意见；上线前人工复核 models.dev / Arena / AA 最新条款。
- 确认 MIT 对贡献数据的覆盖；确认 AA 对链接使用的限制；确认 CC BY 署名 / 修改说明完整。
- 确认 GitHub Issues 公开可访问；确认 FX 复核人 / 日期。

---

## 8. 验收标准

### 8.1 数据与管道

- [ ] `data/latest` 通过 JSON Schema + 引用完整性校验；失败时 latest 不变。
- [ ] 43 个首批 ModelVersion 全部可追溯；deprecated-only 不在探索表；beta/alpha 有徽标；MiniMax/Baidu 不在首批并注明原因。
- [ ] Arena text 只含 `category=overall`；webdev 只含 `category=webdev`；无跨榜合并；无档位聚合。
- [ ] 同模型 / 榜 / 条件只有一条 Score；保留 CI / rank / votes / date；未匹配行保留在不匹配表。
- [ ] AA 无站内分数、无 API 调用；`aa_url` 为空时回退总榜。
- [ ] 价格缺失「未公布」、0「免费」、无 Offer + 开源「可自托管」；价格摘要不含 gateway。
- [ ] `fx.yml` 有 rate / as_of；超 14 天 CNY 隐藏；USD 始终显示。
- [ ] override 应用有审计；源数据不被静默修改；冲突进 validation report。
- [ ] 相同 raw snapshot + overrides 的业务数据稳定；manifest 可复现。
- [ ] stale 阈值：models.dev >48h、Arena >72h 提示；不隐藏数据。

### 8.2 UI

- [ ] 探索表默认列 / 默认排序符合 §5.2；筛选 / 搜索 / 排序写 URL；返回保留状态。
- [ ] 详情页顺序符合 §5.3；报价默认折叠 gateway / deprecated；Arena text / webdev 分开；无分数「未收录」。
- [ ] 对比最多 3 个；差异高亮；缺失「—」；URL 可分享；超过 3 个有提示。
- [ ] 榜单两个 Board；前 50 + 显示更多；未匹配保留且不链模型；来源 / 日期 / 许可可见。
- [ ] `/about` 含来源、许可、修改说明、非官方、价格 / FX 免责、隐私、纠错。
- [ ] 移动端卡片 + 筛选抽屉；对比横向滚动；榜单紧凑列表。
- [ ] 404、空状态、无报价、无 Arena、对比为空、榜单搜索无结果都有明确文案。

### 8.3 SEO / 质量 / 合规

- [ ] 模型页 / 榜单 / `/about` 可索引；compare / 筛选 / 榜单搜索 noindex；canonical 正确。
- [ ] sitemap 含 `/`、模型页、两个榜单、`/about`；robots 允许；compare / filter 不入 sitemap。
- [ ] Lighthouse 模型页 / 榜单移动端 Performance、Accessibility、SEO ≥90。
- [ ] 键盘可达、焦点可见、表格语义、axe smoke 通过。
- [ ] 页脚 / `/about` 许可与署名完整；无第三方 logo；AA 只外链；GitHub Issues 纠错入口可用。
- [ ] 无账号 / cookie / 分析 / 后端 / DB；构建静态导出成功。

---

## 9. 风险与未决项

| 风险 / 未决 | 影响 | 处理 |
|---|---|---|
| GitHub 仓库 / Issues URL 未定 | 纠错入口缺失 | 上线前补齐；否则改邮箱；不得留空 |
| Cloudflare Pages 大陆访问不稳定 | 目标用户体验 | 首版接受；硬要求时迁国内静态托管 + ICP |
| models.dev MIT 对贡献数据覆盖不清 | 许可风险 | 上线前向维护者确认；保留署名 |
| Arena 数据集 category / 日期结构变化 | 评分错误 | 管道硬校验；category / date 规则；失败保留 last good |
| AA 条款 / 链接限制变化 | 外部链接风险 | 上线前复核；必要时移除链接 |
| FX 手动汇率过期 / 不准确 | CNY 误导 | 每周复核；超 14 天隐藏；USD 主币种 |
| models.dev 1,315 条缺 canonical、gateway 分类不准 | 映射 / 展示错误 | 人工 crosswalk；provider kind override；launch set 策展 |
| status=null、价格缺失、推理档位异构 | 误读 | 明确文案 / 徽标；详情显示原始值；不聚合 |
| 首批 43 个模型会过时 | 目录陈旧 | 每日自动进入 + 每周人工检查；deprecated-only 隐藏 |
| 未做正式法律复核 | 合规风险 | 上线前人工复核条款；本规格不构成法律意见 |
| 无历史快照 / 无分析 | 无法看趋势 / 流量 | MVP 明确不做的范围；后续另开 effort |

---

## 10. 实现计划（下一阶段，不在本 effort）

| 阶段 | 产出 |
|---|---|
| 0. 仓库与脚手架 | GitHub repo、Next.js 15 + TS + Tailwind、CI、Cloudflare Pages、`/about` 占位 |
| 1. 数据管道 | 抓取 / 归一化 / 校验 / 原子晋级 / manifest / override / crosswalk / fx；43 个首批模型 |
| 2. 应用骨架 | A Workbench 设计 token、导航、页脚、URL 状态、数据加载 |
| 3. 探索表 | TanStack Table、筛选、排序、搜索、移动卡片、对比托盘 |
| 4. 详情 / 对比 | 报价表 / 折叠、Arena 卡片、AA 外链、compare 页 |
| 5. 榜单 / About | 两个 Board、未匹配、来源 / 许可、`/about` |
| 6. SEO / 质量 | metadata、sitemap、robots、canonical、OG、Lighthouse、axe |
| 7. 上线检查 | 许可复核、GitHub Issues、域名 / 托管、数据 stale、404、Playwright smoke |

---

## 11. 一致性检查

已检查所有已关闭票，结论如下：

| 检查项 | 结果 |
|---|---|
| AA 只外链、不嵌数据 | 04 / 12 / 09 / 10 一致 |
| Arena 只用 text + webdev，不跨榜 | 04 / 05 / 08 / 12 一致 |
| 模型版本为主、Offer 为辅 | 03 / 05 / 06 一致 |
| 缺失分数「未收录」并沉底 | 04 / 06 一致 |
| 43 个首批模型 | 05 / 06 / 08 一致；原型仅 12 个样例，不冲突 |
| 静态 JSON + 每日 CI | 08 / 09 一致 |
| 无后端 / DB / 账号 / 分析 | 06 / 09 / 10 一致 |
| 浅色 / 无图表 / 无暗色 | 06 / 09 一致 |
| `/about` | 合规票要求，技术票原路由表遗漏；已在票 09 加 addendum，本规格纳入路由与 sitemap |
| `data/fx.yml` | 合规票要求，管道票原输出表遗漏；已在票 08 加 addendum，本规格纳入 manifest / 展示 |
| 推理等级展示 | 研究票建议表格三态、详情原始；本规格定为「可调 / 固定 / 未标 / 不支持」+ 详情原始档位，和 02 / 03 / 06 不冲突 |
| 价格 CNY | 03 / 06 / 10 一致：USD 主、CNY 展示层、手动 FX、超 14 天隐藏 |

未发现其他冲突。若实现阶段发现新冲突，按票 10 的规则：先开新票或回写相关票，不静默改口径。
