# 数据源可得性、授权与字段

- 对应票：[01-data-source-feasibility](../issues/01-data-source-feasibility.md)
- 研究日期：2026-10-26
- 状态：研究完成；只给事实、选项与风险，不做最终产品决策
- 方法：以官方仓库、官方 API/文档、官方条款与 HuggingFace 官方数据集为主；models.dev 覆盖统计来自本地快照 `/tmp/models-dev.json`（2026-10-26 15:53 CST 抓取，含专门模型类型）。页面与 API 均在 2026-10-26 实际访问。
- 免责声明：以下是对公开条款的整理，不构成法律意见。条款可能更新，正式上线前应由法务复核，并向数据方取得书面确认。

## 0. 结论摘要

1. **models.dev 适合作为主数据底座并站内嵌入。** 仓库为 MIT 许可，v1 API 有“不破坏向后兼容”的维护约束，数据近乎每小时更新；但没有正式 SLA、速率限制或独立 API ToS。在本票三个来源中，它是唯一同时提供“模型级事实 + 各托管商价格/上下文/推理控制”的来源。[1][2][3][4][6]
2. **8,940 不是 8,940 个模型，而是 8,940 条“供应商 × 模型”记录。** 同日抓取只有 4,091 个不同模型 ID、606 条模型级记录（`/models.json`），文本/推理可用的 canonical 模型约 508 个。做 UI 和统计前必须先去重。[7][8]
3. **Arena 有官方、可自动获取、可嵌入的数据集。** `lmarena-ai/leaderboard-dataset` 在 HuggingFace 上以 CC BY 4.0 发布，含 text/text_style_control/webdev/agent 等 24 个子集、latest 与 full 两种 split，约每日更新。网站本身 403 且条款禁止自动抓取，因此应使用 HF 数据集而不是抓网页。[17][18][19][21]
4. **Artificial Analysis 在现行条款下不适合站内嵌入。** 免费 API 存在且字段可用，但 Data Platform Terms v1.1 明确禁止把 raw Data 嵌入面向客户的产品/API/dashboard，也禁止用于“模型/供应商选择建议”类竞争产品；Pro 订阅也不授予再分发权。除非取得书面许可/商业协议，否则首版应只外链。[10][11][14][15]
5. **跨源身份没有现成公共主键。** models.dev 的 `canonical_model_id`（`lab/model`）最适合当主键；AA 用稳定 UUID + creator UUID；Arena 只有 `model_name` + `organization`。三边还存在“把 reasoning effort 当成独立模型”的粒度差异，必须建人工维护的映射表，不能只靠名称模糊匹配。[2][7][11][17]
6. **其他评测源只能做补充。** SWE-bench 主仓库 MIT，但排行榜是任务特定的社区提交，实验仓库未声明许可；LiveBench 许可文件为 Apache-2.0 + MIT 拼接文本，且没有现成的聚合 API。首版不必纳入。[23][24]

## 1. 来源 / 访问矩阵

| 来源 | 访问方式与 URL | 许可 / 条款 | 可用字段 | 覆盖 | 更新 | 嵌入 vs 外链建议 |
|---|---|---|---|---|---|---|
| **models.dev** | 公开 REST：`https://models.dev/api.json`、`/models.json`、`/catalog.json`、`/model-schema.json`；仓库 `github.com/anomalyco/models.dev` | 仓库 MIT；未发现独立 API ToS、速率限制或 SLA；MIT 要求保留版权/许可声明 | 模型名、描述、family、release/last_updated、knowledge、modalities、limit、open_weights、reasoning、`reasoning_options`、tool_call、structured_output、temperature；供应商价格 `cost`（含 context tiers）、`status`、`canonical_model_id`、`type`；模型级 `license`/`benchmarks`/`weights` 仅在 `/models.json` 更完整 | 232 个供应商、8,940 条供应商模型记录、606 条模型级记录；文本 canonical 约 508 个 | 近实时/每小时级（100 次提交约 26 小时）；建议每日快照 | **嵌入（主数据源）**；页脚署名 + 链接 + MIT 许可声明 |
| **Artificial Analysis Data API** | `https://artificialanalysis.ai/api/v2`；免费 `/language/models/free`；Pro+ `/language/models`、`/{slug}`；需账号与 `x-api-key` | 网站 Terms of Use + Data Platform Terms v1.1；API 全 tier 要求署名；**禁止把 raw Data 嵌入客户产品、禁止竞品/选择建议产品**；Pro 也不得再分发 raw files | 免费：稳定 `id`、name、slug、release_date、creator、Intelligence/Coding/Agentic + 6 个 Capability Index、输入/输出/cache 价格、median speed/TTFT/TTFA/E2E；Pro 另含完整 eval 集、token counts、blended price、百分位、context、parameters、modalities、`licensing.is_open_weights`、`huggingface_url`、`openrouter_api_id` | 官方称 500+ 模型、100+ 推理供应商、1,000+ endpoints；免费 API 只返回公开子集 | 官方目标：领先模型/供应商发布后 24 小时内完成 benchmark；未承诺 API 快照频率 | **只外链**（除非拿到书面许可/商业协议）；不要做站内分数表 |
| **Artificial Analysis 网站/榜单** | `https://artificialanalysis.ai/leaderboards/models` 等公开页面 | Terms of Use：仅个人/非商业；禁止复制、分发、衍生、竞品、自动查询/抓取 | 榜单、模型页、图表、方法论 | 同上 | 持续 | **只外链**；不做结构化复制；如需引用单点，按 Data Platform Terms 署名并让法务确认 |
| **Arena 官方 HF 数据集** | `https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset`；Parquet，`latest`/`full` split | **CC BY 4.0**；需署名、链接许可、注明修改 | `model_name`、`organization`、`license`、`rating`、`rating_lower/upper`、`variance`、`vote_count`、`rank`、`category`、`leaderboard_publish_date`；Agent 子集用 `score`/CI/`observation_count`/`session_count` | 24 个子集；text latest 11,099 行 / full 1,223,700 行；webdev latest 647 / full 30,391；含 text_style_control、agent、vision、search、document 等 | HF 提交约每日 03:00 UTC；发布日通常滞后 1–2 天 | **嵌入（榜单层）**；署名 Arena + CC BY 4.0 链接 + 修改说明；方法论外链 arena.ai |
| **Arena 网站** | `https://arena.ai/leaderboard`、`/leaderboard/text` 等 | Terms of Use：仅个人/内部业务使用；禁止复制/镜像/分发/商业利用；禁止程序化或自动访问、抓取 | 实时榜单、分类榜、模型页 | 与 HF 数据集同源，但更新可能更快 | 持续 | **只外链**；不要抓取；403 不要绕过 |
| **LiveBench** | `https://livebench.ai/`；数据/答案在 HuggingFace `livebench/*`；仓库 `LiveBench/LiveBench` | LICENSE 文件拼接 Apache-2.0 + MIT 文本；GitHub 元数据为 `NOASSERTION`；各 HF 数据集许可需逐个确认 | 分类分数、题目、模型答案/判定；无官方聚合 JSON API | 6 个类别、月度新题 | 月度新题；榜单更新不定 | **外链/人工摘录**；首版不纳入 |
| **SWE-bench** | `https://www.swebench.com/`；仓库 `SWE-bench/SWE-bench`；提交经 `sb-cli` | 主仓库 MIT；排行榜实验/预测仓库 `SWE-bench/experiments` 未声明 license | Verified/Lite/Multimodal 等任务分数、提交记录 | 软件工程任务，非通用对话 | 社区提交驱动 | **外链**；只适合作为编码 agent 的细分指标 |

## 2. models.dev

### 2.1 访问、许可与稳定性

- GitHub 仓库现为 **`anomalyco/models.dev`**（`sst/models.dev` 会重定向），默认分支 `dev`，2026-10-26 仍有提交。[1]
- 仓库根目录为 **MIT License**（Copyright 2025 models.dev）。MIT 允许使用、复制、修改、合并、发布、再许可和销售，条件是保留版权与许可声明。[4] 未发现单独的“数据许可”或额外署名条款；模型级 `license` 字段是“模型许可证”，不是数据集许可。[2][8]
- API 端点：[2]
  - `https://models.dev/api.json`：供应商 × 模型视图（含价格、托管差异、`canonical_model_id`）。
  - `https://models.dev/models.json`：模型级事实（与托管商无关），含 `license`、`benchmarks`、`weights`、`links` 等更丰富字段。
  - `https://models.dev/catalog.json`：两者合并。
  - `https://models.dev/model-schema.json`：schema。
  - `?type=...` 过滤；专门类型默认省略，`?type=all` 返回完整目录。[2]
- 组合方式：`/models.json` 提供模型级事实，`/api.json` 提供托管商价格/限制/推理控制，用 `canonical_model_id` 或供应商模型 ID 关联；`/catalog.json` 已把两者合并。[2]
- 无需认证；响应带 `ETag`、`access-control-allow-origin: *`、`cache-control: public, max-age=0, must-revalidate`。适合条件请求和每日快照。[5]
- **稳定性**：维护者明确要求“Never break v1”，v1 字段不得增删改名或改类型；`bun run v1:check` 会比较 v1 输出并阻止不兼容变更。v2 API 仍在演进，但 v1 继续发布。[3] 没有正式 SLA、版本化 URL 或弃用时间表；不能把“v1 稳定”理解为可用性承诺。
- **更新频率**：GitHub commits API 显示 2026-10-25 05:26 至 2026-10-26 07:44 UTC 之间有 100 次提交（10-25 45 次、10-26 55 次），大量是 OpenRouter/Kilo/NanoGPT 等网关目录的自动同步。[6] 数据新鲜度很高，但“模型级事实”与“网关价格”更新节奏不同；首版每日快照足够，且应记录抓取时间与 ETag。
- **未发现独立 API ToS / rate limit / SLA**：README、AGENTS.md 与主页均未给出这些条款。[2][3][25] 这不等于没有限制；正式使用前建议向维护者确认，并在页脚保留 models.dev 署名与 MIT 声明。

### 2.2 覆盖统计（2026-10-26 快照）

| 指标 | 数值 | 说明 |
|---|---:|---|
| 供应商数 | 232 | 含大量网关/转售商，不是 232 个模型实验室 |
| 供应商 × 模型记录 | 8,940 | 票面“8,940 个模型”的实际含义 |
| 不同模型 `id` 字符串 | 4,091 | 供应商自定义 ID，不能直接当全局模型数 |
| 有 `canonical_model_id` 的记录 | 7,625 | 85.3% |
| 不同 canonical ID | 622 | `lab/model` 形式 |
| `/models.json` 模型级记录 | 606 | 模型级事实集合 |
| canonical ID 无模型级记录 | 53 | 多为 embedding/rerank/图像/语音；文本仅 4 个 |
| 无 canonical 的记录 | 1,315 | 14.7%，多为网关特有/新模型 |
| 文本输出 chat 记录 | 8,462 | `type` 缺失或 `chat`，输出仅 text |
| 文本 canonical 模型 | 508 | MVP 候选池（仍需精选） |
| 文本记录有 canonical | 7,351 | 1,111 条文本记录无 canonical |
| 文本记录 reasoning=true | 6,728 | 推理模型覆盖高 |
| 文本记录有 cost | 8,289 | 绝大多数有价格 |
| 文本记录有 knowledge | 5,097 | 60.2% |
| 有 `cost.tiers` 的记录 | 795 | 上下文分档价格 |
| `status=deprecated` | 904 | 供应商级“不再服务”，不是全局退役 |
| `open_weights=true` | 4,246 | 记录级，受网关重复影响 |

统计口径：本地快照 `/tmp/models-dev.json`，脚本按 provider 遍历 `models` 计算；`/models.json` 单独抓取。[7][8]

覆盖结构上的注意点：

- 记录数被网关放大：NanoGPT 649、LLMGateway Providers 430、Vercel 416、Kilo 397、OpenRouter 390 条，而 Anthropic/OpenAI 等第一方供应商只有少量记录。[7] 做“模型数”或“供应商数”时必须去重，否则会误导。
- 中国厂商有覆盖，但记录数差异大：DeepSeek 4、Alibaba 53（中国区 `alibaba-cn` 80）、Z.AI 18、Zhipu AI 17、Moonshot AI 6、MiniMax 8、StepFun 7、Xiaomi 6、Volcengine Ark 16。[7] 这足以支撑首批中国模型，但仍需按“精选主流文本/推理模型”规则筛选。
- `type` 分布：缺失 8,487（默认 chat）、image 180、embedding 82、video 69、speech 43、transcription 38、reranking 17、realtime 16、显式 chat 8。[7] 票面的 8,940 含专门类型；MVP 应过滤到文本/推理。
- 模型级 `license` 只覆盖 120/606，且大小写/写法不统一（`Apache-2.0`、`Apache 2.0`、`apache-2.0` 等）；`benchmarks` 164、`weights` 239、`links` 28。[8] 如果产品要展示“模型许可”，需要归一化并接受大量缺失。
- 对“模型版本为主、托管报价为子行”的直接含义：主行用 canonical/模型级记录，子行只取第一方供应商 + 少量主流网关的 `cost`/`limit`/`reasoning_options`；不要把 8,940 条记录平铺成 8,940 个模型。首版精选集可进一步把范围压到 30–50 个模型。[7]

### 2.3 字段语义

| 字段 | 语义 | 覆盖/取值 | 使用注意 |
|---|---|---|---|
| `canonical_model_id` | 供应商模型指向的原始 lab/model ID，例如 `anthropic/claude-opus-5-5`、`openai/gpt-6-astra` | 7,625 条记录、622 个不同值 | 最适合做跨供应商去重和跨源映射主键；但 1,315 条缺失，53 个 canonical 无模型级记录，不能假设一定可解析 |
| `cost` | 该托管商的美元价格，单位 USD / 1M tokens；含 `input`、`output`、`cache_read`、`cache_write`、`reasoning`、音频等 | 8,545 条记录 | 价格是“托管商 × 模型”级别，不是模型级；同一模型在不同网关价格不同；币种统一 USD |
| `cost.tiers` | 按上下文长度分档的价格数组；每档含 `tier.type="context"`、`tier.size` 与 input/output/cache 价格 | 795 条记录 | 分档点由各供应商定义，未跨供应商归一化；schema 只给 `size`，档位是“阈值”还是“区间”需按供应商文档确认 |
| `status` | `alpha` / `beta` / `deprecated`；`deprecated` 表示该托管商公开 API 不再提供 | 904 条 deprecated、73 beta、1 alpha；7,962 条无值 | 是供应商级状态，不是模型全局生命周期；无值不等于“active”，只表示未标记 |
| `reasoning` / `reasoning_options` | 是否支持推理，以及该托管商 API 接受的控制方式：`toggle`；`effort` + `values`；`budget_tokens` + `min`/`max` | 6,806 条有 options；effort 值含 `none/minimal/low/medium/high/xhigh/max/default`；toggle 1,429 条、budget 608 条（可多选） | 同一模型可能同时有 toggle + effort + budget；展示时必须区分“开关”“档位”“token 预算”，不能压成一个分数 |
| `type` | 模型专门类型；缺失默认 chat；专门类型含 image/video/embedding/reranking/decision/transcription/speech/realtime | 8,487 条缺失 | `/api.json` 默认省略专门类型；票面 8,940 是含专门类型的快照；MVP 应过滤文本 |
| `open_weights` | 权重是否公开 | true 4,246 / false 4,694 | 记录级；网关重复会放大；模型级以 `/models.json` 为准 |
| `knowledge` | 知识截止日期，`YYYY-MM` 或 `YYYY-MM-DD` | 5,228 条 | 缺失多；不要用 release_date 代替 |
| `limit` | `context`、可选 `input`、可选 `output`，单位 token | 8,940 条全部有 | 供应商可能对同一模型限制不同；`input` 缺失时不要假设等于 context |
| `release_date` / `last_updated` | 首次公开发布 / 最近更新，`YYYY-MM` 或 `YYYY-MM-DD` | 全部有 release_date；last_updated 多数有 | 供应商可覆盖 `last_updated`；与模型级日期可能不同 |
| `modalities` | 输入/输出模态 | 全部有 | v1 只允许 text/audio/image/video/pdf；v2 源文件用 MIME 类型；MVP 只关心文本输出 |
| `interleaved` | 交错推理字段格式（`reasoning_content` / `reasoning_details`） | 1,336 条 | 与“推理等级”不是一回事，展示时不要混用 |

语义来源：README 的 v1 API 字段说明、`schema.ts`、本地快照统计。[2][7][9]

## 3. Artificial Analysis

### 3.1 访问方式与 tier

- 官方 Data API v2，基址 `https://artificialanalysis.ai/api/v2`；需在 Insights Platform 创建账号并生成 API key，放在 `x-api-key` header。[10][11]
- 端点：
  - 免费：`GET /api/v2/language/models/free`（以及 11 个 media `/free` 端点）。[11]
  - Pro+：`GET /api/v2/language/models`、`GET /api/v2/language/models/{slug}`，以及 media 非 `/free` 端点。[11]
  - Commercial：provider 级数据、7/30/90 天 performance over time、raw measurements。[11]
- 速率限制：**Free 100 次 / 24 小时；Pro 500 次 / 24 小时；Commercial 自定义**。[11] 旧版 API reference 仍写“1,000 requests/day”，与当前 OpenAPI/文档冲突；以当前 Data API 文档为准，签约前再确认。[10][12]
- 免费 API 只返回 **Free-shape**：`id`、`name`、`slug`、`release_date`、`model_creator{id,name}`、Intelligence/Coding/Agentic 三个 headline index、六个 Capability Index、`artificial_analysis_intelligence_index_cost`、输入/输出/cache 价格、median output tokens/s、median TTFT、median time to first answer token、median end-to-end response time。[11]
- 旧版 API reference 的示例还列出 `artificial_analysis_math_index`、MMLU-Pro、GPQA、HLE、LiveCodeBench 等字段；当前 OpenAPI 的 Free-shape 描述只列 Intelligence/Coding/Agentic + 六个 Capability Index，Math 是否仍在当前响应中需用实际 key 验证。[11][12]
- 免费 API **不返回**：完整 eval 集、token counts、blended pricing、性能百分位、context window、parameters、modalities、licensing、provider detail。[11] 因此它不能单独支撑模型目录；目录事实应来自 models.dev。
- Pro 额外返回：完整 per-benchmark eval（如 HLE、GPQA Diamond、SciCode、Terminal-Bench、AA-LCR、AA-Omniscience 等）、blended 3:1 / 7:2:1 价格、性能百分位、`context_window_tokens`、`parameters`、`modalities`、`licensing.is_open_weights`、`huggingface_url`、`openrouter_api_id`、`reasoning_model`、creator country。[11]
- Pro 的定价页功能表还列出 Data Export、API and Databook Download；这些是“导出/下载”能力，不等于再分发许可，仍受 Data Platform Terms 限制。[13][15]
- 文档要求 key 只放服务端、不要放客户端代码，并缓存响应以避免公开 key/rate limit；每个 key 属于组织，重新生成会立即吊销旧 key。[10][12]
- **模型 ID**：官方建议用 `id` 与 `model_creator.id` 作为主标识，因为稳定；`slug`/`name` 可能变化。[12] 免费响应里 `name` 可能带推理档位后缀，例如 `gpt-oss-20B (high)`；示例中 `id` 为变体级 UUID。[11]

### 3.2 覆盖与更新

- 官方 About 页：500+ 模型、100+ 推理供应商、1,000+ endpoints、1T+ evaluation tokens。[16]
- Intelligence Index 当前为 **v4.3.2**，含 10 个评测：AA-Briefcase v1.1、GDPval-AA v2.1、AutomationBench-AA（部分分）、Terminal-Bench 4.0、SciCode、AA-LCR v1.1、AA-Omniscience、HLE、GDP.pdf、CritPt；Coding/Agentic 是子集派生，不单独版本化；六个 Capability Index 单独版本化。[10][11]
- 响应中的 `intelligence_index_version` 是分数归属版本的权威来源；跨版本分数不应直接比较。[10][11]
- 更新节奏：官方称“通常目标是在领先模型/供应商发布后 24 小时内完成 benchmark”。[13] 这是 benchmark 新鲜度目标，不是 API 数据快照 SLA。

### 3.3 许可与条款：为什么首版不宜嵌入

- **网站 Terms of Use**（v1.0，2024-04-28）：
  - 仅授予个人、非商业使用；不得许可、销售、出租、分发、托管或商业利用 Site 内容；不得修改/衍生/反向工程；不得用 Site 构建相似或竞争产品；不得复制、再发布、下载、展示或传输；不得用自动化 agent/脚本进行自动搜索、请求或抓取。[14]
- **Data Platform Terms**（v1.1，2026-08-19）明确也约束 **free tier**：[15]
  - 所有 tier 的基础许可是 Internal Use；另允许公开分享图表/可视化（需署名）和简短的单点引用，但**不得以结构化、表格化或机器可读形式复制 Data**。[15]
  - Pro/Commercial 可把部分 Data 放入报告/演示等外部交付物，但**不得再分发 raw Data files**（CSV/Excel/JSON 等）。[15]
  - **§2.4(c)**：不得“Embed or otherwise make raw Data available through any customer-facing product, API, dashboard, or service”。[15]
  - **§2.4(d)**：不得把 Data 与第三方数据组合成面向第三方的产品/数据集/服务。[15]
  - **§2.5**：未经书面同意，不得把 Data 用于开发/运营“benchmarking, ranking, comparison, competitive intelligence, or model/provider selection guidance”类产品；并明确禁止 Competitive Product、复制评测方法、制作实质相似的数据产品。[15]
  - 署名：所有 tier 在对外展示/发布时必须署名；Data & Metrics 要求 “Source: Artificial Analysis (artificialanalysis.ai)” 并尽可能超链接；图表需可见 logo；衍生数据需 “Based on data from Artificial Analysis” + 非背书声明。[15]
- **价格**：Pro 为 **$417/月/seat**（年付省 $984）；Enterprise 定制；页面明确“For data redistribution or external use, contact us”。[13] Pro 只解决“内部使用 + 报告中的有限引用”，不解决公开产品嵌入。
- **文档与条款的张力**：API 文档说“display or share API data, credit Artificial Analysis；可见 byline/footer 即可”，但 Data Platform Terms 的 §2.4(c)/§2.5 对“客户产品嵌入”和“选择建议产品”有更具体限制。[10][15] 对 Model Hub 这种公开对比/选型站，不能仅凭文档那句话认定可以嵌入；应以书面许可为准。
- **研究建议**：首版把 AA 作为**外链**（模型详情页/榜单页链接），不要在站内复刻分数表；如果 AA 分数是产品核心，则需要与 AA 谈明确许可（免费 or 商业），并把“允许的字段、展示形式、署名、缓存/再分发”写进协议。Pro 订阅本身不够。

## 4. Arena

### 4.1 网站访问与 403

- 2026-10-26 实测：`https://arena.ai/` 与 `https://arena.ai/leaderboard` 返回 **403**，页面标题为 Cloudflare 的 “Just a moment...”；`/about`、`/faq`、`/terms-of-use` 返回 200。[21]
- `robots.txt` 对 `/leaderboard` 等路径写 `Allow`，但 Terms of Use 明确禁止“programmatic or automated means or automatically query the Services”，并禁止用 spider/robot/scraper/crawler 提取或下载数据（搜索引擎索引除外）。[19][21] **robots 允许抓取不等于条款允许自动查询；403 是 Cloudflare bot challenge，不应绕过。**
- 因此：网站只做外链；需要数据时走官方 HF 数据集。官方 FAQ/About 中未发现公开 REST API；FAQ 明确把公开数据指向 HuggingFace。[17][20]

### 4.2 官方 HuggingFace 数据集

- 数据集：`lmarena-ai/leaderboard-dataset`，**CC BY 4.0**，官方 Arena 账号发布。[17]
- 结构：24 个 config，每个 config 有 `latest` 与 `full` 两种 split；覆盖：
  - `text`、`text_style_control`、`text_factuality`
  - `vision`、`vision_style_control`
  - `search`、`search_style_control`、`search_factuality`
  - `document`、`document_style_control`
  - `webdev`（Code Arena）
  - `agent` 及 7 个 agent signal 子集（bash reliability、steerability、tool hallucination 等）
  - 图像/视频相关子集（MVP 不需要）[17]
- 字段（text/vision/search/document/webdev 等）：
  - `model_name`：模型标识/显示名，常带推理档位后缀，如 `Claude Opus 5.5 (High)`、`GPT-6 Astra (Max)`、`Claude Sonnet 5.5 (xHigh)`。
  - `organization`：机构 slug，如 `anthropic`、`openai`、`google`。
  - `license`：模型许可证（如 `Proprietary`），不是数据集许可证。
  - `rating`：Arena Score；`rating_lower/upper`：95% 置信区间；`variance`；`vote_count`；`rank`；`category`；`leaderboard_publish_date`（`YYYY-MM-DD`）。[17]
- Agent 子集用 IPS 分数而非 Bradley-Terry：`score`、`score_ci_lower/upper`、`observation_count`、`session_count`、`rank`、`category`。[17]
- 规模：text `latest` 11,099 行 / `full` 1,223,700 行；webdev `latest` 647 / `full` 30,391；text latest parquet 约 0.6 MB，text full parquet 约 61 MB。[17]
- 更新：HF commits 显示 2026-10-20、10-21、10-23、10-24 均有约 03:00 UTC 提交（接近每日）；text 最新发布日为 2026-10-22，webdev 为 2026-10-23（数据集提交 2026-10-24）。即 **约每日更新，发布日通常滞后 1–2 天**。[18][26]
- 历史起点：Search 2025-08-07、WebDev 2025-11-12、Agent 2026-06-04；更早的 text 历史可追溯到 Bradley-Terry 切换（2024-01-09）。[17]

### 4.3 指标与展示注意

- text/vision/search/document/webdev 使用 **Bradley-Terry Arena Score**；Agent 使用 IPS。两者不可混算。[17][20]
- **WebDev 是 Code Arena 的人类偏好榜，用 Arena Score，不是 pass@1 或单元测试通过率**；若产品要表达“工程正确性”，需要另找 SWE-bench 等任务型指标，不能把 WebDev 分数解释成正确率。[17]
- text/vision 自 2025-05-16 起默认 **style control**，并有 frequency-based re-weighting（2025-07-23）；因此 text 主榜应优先用 `text_style_control`，不要与 `text` 原始分数混在同一列。[17]
- 同一模型会按 `category` 重复（overall、coding、math 等）；主表应筛 `category=overall`，分类榜单独展示。[17]
- **Arena Score 不可跨 arena 比较**：text 约 1500 量级，webdev 约 1800 量级；把两者放同一“总分”会误导。[26]
- `latest` 是“最近一次发布”的快照，不是实时；页面显示日期时必须用 `leaderboard_publish_date`，不要用抓取日期冒充。[17][26]

### 4.4 许可与嵌入

- CC BY 4.0 允许复制、分发、修改、商业使用，条件是：署名、提供许可链接、注明是否修改、不得暗示背书。[22]
- 建议的站内署名格式（示例）：“榜单数据来自 Arena（arena.ai），按 CC BY 4.0 使用；本页对字段做了中文化与筛选。” 同时链接到数据集与 CC BY 4.0 deed。[17][22]
- 数据集是官方单独分发，适用 CC BY 4.0；网站内容仍受 Arena Terms of Use 约束。不要把“HF 数据集可嵌入”理解为“网站可抓取”。[17][19]
- 模型名称/商标属于各模型厂商；`license` 字段只说明模型许可证，不授予商标使用权。展示时保留原名称，中文翻译只作辅助。

## 5. 跨源模型身份

### 5.1 各源暴露的标识

| 源 | 主标识 | 版本/变体粒度 | 备注 |
|---|---|---|---|
| models.dev | 供应商级 `id`；模型级 `canonical_model_id`（`lab/model`） | 模型级；推理档位在 `reasoning_options` 中，不拆成独立模型 | `canonical_model_id` 有 1,315 条缺失；622 个不同值；53 个无模型级记录。[7][8] |
| Artificial Analysis | 稳定 UUID `id`；`model_creator.id`；`slug`/`name` 可能变 | 变体级；`name` 可带 `(high)` 等后缀，`id` 区分变体 | 免费 API 有 UUID；Pro 额外有 `openrouter_api_id`，可作为与 OpenRouter 模型 ID 的桥，但是否等于 models.dev canonical 仍需校验。[11][12] |
| Arena | `model_name` + `organization`；无稳定 UUID | 变体级；`(High)/(Max)/(xHigh)` 是独立行 | 名称是显示风格，含空格/点号/版本日期；`organization` 是机构 slug。[17] |

### 5.2 匹配难点（用当前快照举例）

- **标点不统一**：models.dev canonical 用连字符 `anthropic/claude-opus-5-5`，但很多供应商 `id` 用点号 `claude-opus-5.5`；canonical 与 provider id 也不完全统一，例如 canonical `openai/gpt-6.1-sol`，provider id 可能是 `gpt-6-1-sol`。[7]
- **供应商前缀/区域后缀**：`anthropic/`、`openai/`、`~openai/`、`@default`、`@eu`、Bedrock 的 `us.`/`global.`、`anthropic.claude-...` 等；同一 canonical 模型会有几十条托管记录。[7]
- **推理档位被拆成独立实体**：Arena 的 `Claude Opus 5.5 (High)`、`GPT-6 Astra (Max)`；AA 的 `gpt-oss-20B (high)`；models.dev 则是同一模型 + `reasoning_options.effort`。[7][11][17] 若直接把 Arena 行匹配到 models.dev 模型，会把“模型 + 档位”误当成“模型”。
- **别名/代号**：`latest`、`-pro`、`-fast`、`highspeed`、`thinking`、codenames 等；部分供应商行没有 canonical，无法自动归属。[7]
- **版本粒度不同**：Arena 名称可能带日期（如 `gpt-4o-2024-05-13`），AA 用 `release_date`，models.dev 用 `release_date`/`last_updated`；同一代模型的快照日期可能不同。
- **AA 的 `openrouter_api_id` 只在 Pro 返回**；免费 API 拿不到，不能作为免费层的通用桥。[11]

### 5.3 初始匹配策略选项

| 选项 | 做法 | 优点 | 代价/风险 | 适用 |
|---|---|---|---|---|
| **A. 人工维护 crosswalk（建议作为 MVP 起点）** | 以 models.dev `canonical_model_id` 为主键，建表：`canonical_id ↔ AA id/slug ↔ Arena organization+model_name`；只映射首批精选 30–50 个模型；变体单独存 `source_variant` / `reasoning_effort`；未匹配显式标记“仅外链” | 精度最高；可解释；MVP 规模小，维护量可控 | 新模型上线需人工补；AA/Arena 改名要跟进 | 首版精选集 |
| **B. 规则归一化 + 人工复核队列** | 小写、去供应商前缀/区域后缀、点号↔连字符、去 `(High/Max/xHigh)` 并写入 effort 字段、机构别名表；高置信自动匹配，其余进队列 | 可扩展；能处理大部分命名差异 | 规则会误伤（如 `-pro`/`-fast` 是不同 SKU）；需要持续维护 | A 的辅助，不建议单独自动合并 |
| **C. 模糊/LLM 辅助匹配** | 名称相似度/嵌入召回 + LLM 判定 + 置信度阈值；只生成候选，人工确认 | 对别名/翻译友好 | 误合并风险高；需要评测集；可解释性差 | 仅用于发现候选 |
| **D. 不做跨源合并** | 各源分开展示；Arena/AA 只外链；站内只展示 models.dev 模型页 | 法律与维护成本最低 | 对比体验弱；无法做“同模型跨源分数” | 保守兜底 |

研究建议（供下游决策，不是最终决定）：**A + B 辅助**。先用人工表保证首批模型正确，再用规则生成候选和缺失告警；任何自动匹配都不直接发布，必须经过人工确认。AA 若只外链，则 crosswalk 只需保存 AA 链接与展示名；Arena 因可嵌入，需要更完整的映射。

## 6. 其他免费/可署名/可自动获取的评测源（只列事实）

- **LiveBench**：官网 `livebench.ai` 有榜单；题目/答案/判定在 HuggingFace `livebench/*`；README 提供 `download_leaderboard.py` 下载答案与判定，但没有现成的聚合分数 API。题目按月更新以降低污染。LICENSE 文件拼接 Apache-2.0（FastChat）与 MIT（LiveCodeBench）两段文本，GitHub 元数据标为 `NOASSERTION`；各 HF 数据集许可需逐个确认。若要嵌入，需自行重算/解析，成本高于 Arena。[23]
- **SWE-bench**：主仓库 MIT；官网 `swebench.com`；排行榜通过 `sb-cli` 提交，预测/结果在 `SWE-bench/experiments`，该仓库未声明 license。它衡量软件工程任务，不是通用对话/推理总分；适合作为编码 agent 的细分指标，不适合放进通用模型总分。[24]
- 结论：这两个源都不解决“首版模型目录 + 通用对比”的核心需求；最多作为后续编码专项或补充列，首版不必纳入。

## 7. 未解决问题

1. **models.dev 的 MIT 是否覆盖所有贡献数据**：仓库只有根 LICENSE，没有单独的数据许可/贡献者条款；provider 价格等事实数据的权利基础未单独说明。正式商用前建议法务确认，并在页脚保留 MIT 声明与 models.dev 链接。[1][4]
2. **AA 能否给公开中文对比站授权**：需要明确（a）是否允许站内结构化展示免费 API 字段；（b）是否允许缓存/快照；（c）是否允许与 models.dev/Arena 数据同表展示；（d）署名与商标要求；（e）费用。现行 §2.4(c)/§2.5 对 Model Hub 这类产品非常不利，Pro 订阅不等于授权。[15]
3. **AA 免费 vs Pro 的字段边界与速率限制**：当前文档写 Free 100/24h、Pro 500/24h，旧 reference 写 1,000/day；需在签约/接入时以账号实际响应为准。[10][11][12]
4. **Arena 的署名与商标边界**：CC BY 4.0 要求署名/许可链接/修改说明；Arena 名称、logo、榜单“官方”措辞是否可用，需看品牌指南；模型名称/trademark 归各厂商。[17][22]
5. **Arena 榜单选择**：text 主榜用 `text_style_control` 还是 `text`？webdev 与 agent 是否进入首版？同一模型在不同 arena 的分数不可比，产品需要明确“分源展示”的栏位与日期。[17][26]
6. **身份映射的维护责任**：谁维护 crosswalk、多久校验一次、未匹配如何展示、是否允许人工覆盖；`canonical_model_id` 的 53 个 dangling ID 与 1,111 条无 canonical 文本记录如何处理。[7][8]
7. **推理档位的语义**：AA/Arena 把 effort 变体当独立行，models.dev 把它当模型属性；产品是展示“模型级最佳分”“指定档位分”，还是两者都给？这会直接影响跨源可比性。[7][11][17]
8. **新鲜度与版本**：models.dev 近实时但无 SLA；AA 只承诺发布后 24h 内 benchmark；Arena 每日但发布日滞后 1–2 天。页面必须分别显示“数据日期/抓取时间/评测版本”，不能用一个“最后更新”覆盖所有源。[6][13][18]

## 8. 来源

访问日期均为 2026-10-26。

1. models.dev GitHub repository（含 GitHub API 元数据：`anomalyco/models.dev`、MIT、默认分支 `dev`、2026-10-26 推送）— https://github.com/anomalyco/models.dev
2. models.dev README（API、v1 字段说明、`canonical_model_id`、`cost`、`status`、type 过滤）— https://github.com/anomalyco/models.dev/blob/dev/README.md
3. models.dev AGENTS.md（“Never break v1”、v1:check、v2 源文件字段）— https://github.com/anomalyco/models.dev/blob/dev/AGENTS.md
4. models.dev LICENSE（MIT）— https://github.com/anomalyco/models.dev/blob/dev/LICENSE
5. models.dev API 响应头（2026-10-26 实测 `ETag`、CORS、`cache-control`）— https://models.dev/api.json
6. models.dev commits API（100 次提交，2026-10-25 05:26–2026-10-26 07:44 UTC）— https://api.github.com/repos/anomalyco/models.dev/commits?per_page=100
7. 本地 models.dev 快照与统计 — `/tmp/models-dev.json`（2026-10-26 15:53 CST；232 providers / 8,940 rows；脚本统计）
8. models.dev 模型级 API（606 条；`license`/`benchmarks`/`weights`/`links` 覆盖）— https://models.dev/models.json
9. models.dev v1 schema 源码（`ReasoningOption`、`CostTier`、`ModelType`）— https://github.com/anomalyco/models.dev/blob/dev/packages/core/src/schema.ts
10. Artificial Analysis Data API docs（tiers、rate limits、fields、attribution、index v4.3.2）— https://artificialanalysis.ai/data-api/docs
11. Artificial Analysis OpenAPI 2.0（free/Pro/Commercial 字段与排除项、100/500 速率、`openrouter_api_id`）— https://artificialanalysis.ai/api/v2/openapi
12. Artificial Analysis API Reference（旧版免费 API 字段、1,000/day、稳定 ID 建议）— https://artificialanalysis.ai/api-reference
13. Artificial Analysis Pricing（Pro $417/月/seat；年付省 $984；redistribution 联系；24h benchmark 目标）— https://artificialanalysis.ai/pricing
14. Artificial Analysis Website Terms of Use（v1.0，2024-04-28；个人非商业、禁止复制/竞品/自动抓取）— https://artificialanalysis.ai/terms-of-use
15. Artificial Analysis Data Platform Terms and Conditions（v1.1，2026-08-19；free tier 适用；§2.3–2.5、§5 署名）— https://artificialanalysiscdn.com/legal/ProDataPlatformTerms.pdf
16. Artificial Analysis About（500+ 模型、100+ providers、1,000+ endpoints、1T+ tokens）— https://artificialanalysis.ai/about
17. Arena Leaderboard Dataset 卡片（CC BY 4.0；24 configs；字段；text/webdev 规模；style control/IPS 说明）— https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset
18. Arena Leaderboard Dataset commits（每日约 03:00 UTC 更新）— https://huggingface.co/api/datasets/lmarena-ai/leaderboard-dataset/commits/main
19. Arena Terms of Use（个人/内部业务使用；禁止程序化/自动访问与抓取）— https://arena.ai/terms-of-use
20. Arena FAQ（Bradley-Terry、公开数据集、研究数据获取）— https://arena.ai/faq
21. Arena robots.txt 与 403 实测（2026-10-26：`/`、`/leaderboard` 返回 Cloudflare “Just a moment...” 403；`/robots.txt` 允许 `/leaderboard`）— https://arena.ai/robots.txt
22. Creative Commons Attribution 4.0 International（CC BY 4.0）— https://creativecommons.org/licenses/by/4.0/
23. LiveBench 仓库、README、LICENSE（月度新题；HF 数据；Apache-2.0 + MIT 文本；GitHub `NOASSERTION`）— https://github.com/LiveBench/LiveBench
24. SWE-bench 仓库/README（MIT；`sb-cli` 提交；任务特定）— https://github.com/SWE-bench/SWE-bench；实验/预测仓库（无 license）— https://github.com/SWE-bench/experiments
25. models.dev 首页（未发现独立 Terms/Privacy/API ToS 链接）— https://models.dev
26. Arena HF first-rows（text/webdev 的 `leaderboard_publish_date` 与 rating 量级）— https://datasets-server.huggingface.co/first-rows?dataset=lmarena-ai%2Fleaderboard-dataset&config=text&split=latest；https://datasets-server.huggingface.co/first-rows?dataset=lmarena-ai%2Fleaderboard-dataset&config=webdev&split=latest
