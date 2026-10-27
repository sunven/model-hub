# 数据源可得性、授权与字段

Type: research
Status: resolved
Blocked by: none

## Question

首版的数据底座应如何组合 models.dev、Artificial Analysis 与 Arena，哪些数据可以合法嵌入站内，哪些只能外链？

需要回答：

1. **models.dev**：仓库 / 数据许可证、API 稳定性与更新频率、字段语义（`canonical_model_id`、`cost.tiers`、`status`、`reasoning_options`、`type`、`open_weights`、`knowledge`）、是否允许再分发或必须以何种方式署名；232 个供应商 / 8,940 个模型的覆盖概况。2026-10-26 本地抓取的 `/tmp/models-dev.json` 可用于 schema 统计，但授权与更新频率须查官方仓库 / 文档。
2. **Artificial Analysis**：是否有官方 API / 数据下载；价格、条款、速率限制；页面提供哪些指标（Intelligence Index、Coding、Math、speed、TTFT、price 等）；模型命名 / ID 是否能与 models.dev 对齐；是否允许嵌入 / 再分发，还是只能外链。
3. **Arena（arena.ai）**：403 的原因与官方数据获取方式；是否有公开 API、数据集或 HuggingFace 镜像；Code / WebDev 等榜单的指标、更新频率、许可与署名要求；若不可自动获取，外链方案是否可行。
4. **其他免费、可署名、可自动获取的评测源**（如 LiveBench、SWE-bench 等）是否值得作为补充；只列事实与代价，不扩 scope。
5. **跨源模型身份**：各源暴露的模型名称 / ID、版本粒度、别名与匹配难点，给出一个初始匹配策略选项。

产出：一份带来源引用的研究笔记（`.scratch/model-hub/research/01-data-source-feasibility.md`），包含访问方式、字段、许可 / 条款、覆盖、更新频率、嵌入 vs 外链的建议矩阵，以及未解决问题。不要做最终产品决策。

## Answer

研究完成。完整来源、字段语义、覆盖统计、条款原文与访问矩阵见 [研究笔记](../research/01-data-source-feasibility.md)。

**关键事实**

- **models.dev**：仓库 MIT，公开 `api.json` / `models.json` / `catalog.json`，v1 有“不破坏向后兼容”的维护约束，数据近乎每小时更新；未发现独立 API ToS、rate limit 或 SLA。2026-10-26 快照为 232 个供应商、8,940 条“供应商 × 模型”记录，但只有 606 条模型级记录、508 个文本 canonical 模型；`canonical_model_id` 覆盖 7,625/8,940 条，1,315 条缺失。适合做主目录并站内嵌入。
- **Arena**：网站 403（Cloudflare challenge）且 ToS 禁止自动查询/抓取；官方 HuggingFace `lmarena-ai/leaderboard-dataset` 为 CC BY 4.0，含 text、text_style_control、webdev、agent 等 24 个子集，约每日更新。可嵌入，但需署名、许可链接和修改说明；Arena Score 不可跨 arena 比较，推理档位（High/Max/xHigh）是独立行。
- **Artificial Analysis**：免费 API 可用（100 请求/24h，只返回公开子集），但 Data Platform Terms v1.1 禁止把 raw Data 嵌入客户产品/API/dashboard，也禁止用于“模型/供应商选择建议”类竞争产品；Pro $417/seat/月也不含再分发权。首版应只外链，除非取得书面许可/商业协议。
- **跨源身份**：没有公共主键。models.dev 的 `canonical_model_id`（`lab/model`）最适合当主键；AA 用稳定 UUID + creator UUID；Arena 只有 `model_name` + `organization`。需人工维护 crosswalk，不能让名称模糊匹配自动合并。
- **其他来源**：SWE-bench 主仓库 MIT，但排行榜任务特定，实验/预测仓库未声明 license；LiveBench 许可文件为 Apache-2.0 + MIT 拼接文本，且没有现成聚合 API。首版不必纳入。

**选项（供下游决策，不是最终产品决定）**

1. **models.dev 主数据 + Arena HF 嵌入 + AA 外链**：法律风险最低，覆盖目录/价格/推理控制 + Arena 偏好榜；AA 仅链接。最低风险基线。
2. **同上，但向 AA 申请书面许可/商业协议**：可站内展示 AA 的 Intelligence/Coding/速度/价格；体验最好，但需谈判、可能付费，并需约定缓存、再分发、署名。
3. **models.dev + Arena，完全不用 AA**：更简单，失去 AA 的 Intelligence/Coding/speed 维度。
4. **仅 models.dev，AA/Arena 都外链**：最保守，对比价值最弱，但合规与维护成本最低。

未决问题：AA 授权范围与费用；Arena 用 `text` 还是 `text_style_control`、是否上 webdev/agent；crosswalk 维护责任；models.dev MIT 对贡献数据的覆盖。详见研究笔记“未解决问题”。
