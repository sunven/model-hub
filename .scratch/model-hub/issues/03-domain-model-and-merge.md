# 领域模型与跨源合并规则

Type: grilling
Status: resolved
Blocked by: 01, 02

## Question

首版的领域模型如何定义，才能同时表达「同一个模型版本被多个供应商以不同价格 / 上下文提供」，并把 models.dev 的能力 / 价格与 AA / Arena 的评测分数稳定地挂到正确的模型上？

需要定下：

- **实体与关系**：模型版本（Model Version）、供应商（Provider）、托管报价（Offer）、能力 / 推理选项、评测分数（Score）、数据源（Source）、快照（Snapshot）、可能需要的模型家族（Family）。
- **身份**：以 `canonical_model_id` 为主键还是另建内部 ID；别名、版本 / 日期快照、同一模型在不同供应商下的命名差异；模型状态（active / beta / deprecated / alpha）如何进入模型。
- **报价**：模型为主、offer 为子行的展示是否成立；输入 / 输出 / 缓存 / 批处理 / 阶梯计价 / 免费 / 自托管如何处理；价格缺失与币种如何表达。
- **评测**：分数挂到模型版本还是 offer；跨源匹配失败 / 一对多 / 多对一时如何处理；是否允许手工映射覆盖。
- **版本与快照**：上游变更时如何保留可追溯性；哪些字段允许人工覆盖。

推理等级的研究结论：`reasoning_options` 的 effort 是模型特定子集，不是全局八级；toggle 常是唯一关闭方式；同一 canonical 键下不同托管商的支持情况可能不同。领域模型应保存原始形态与来源，合并时取并集，不要把 effort 归一成统一等级。

约束：只读信息市场；首版文本 / 推理 LLM；不引入自定义总分；数据源结论见「数据源可得性、授权与字段」和「推理等级的数据语义与展示口径」。产出应能直接支撑后续信息架构、数据管道和最终规格；关键术语同步到根目录 `GLOSSARY.md`。

## Answer

**决定（2026-10-26）**

### 1. 实体与关系

- **Model Family**（可选分组）：Claude / GPT / Gemini / Qwen 等；只做分组、筛选和展示，不是首版独立页面。`family` 优先取 models.dev，缺失时人工补。
- **Model Version**（主实体）：一个 canonical lab/model 身份的模型版本；模型页、评测、对比都挂在它上面。
- **Provider**（供应商）：提供托管的组织；`kind` 分 `first_party` / `cloud` / `gateway`，首版人工维护；gateway 默认折叠。
- **Offer**（托管报价）：Provider × Model Version 的一次上架；价格、上下文、推理选项、状态的最小粒度。
- **Score**（评测分数）：Model Version × Source × Board × Condition × Snapshot 的一条评分。
- **Source / Snapshot**：每个上游来源和每次抓取快照，所有记录带来源与快照引用。
- **Crosswalk**：跨来源身份映射，人工维护，允许未匹配。
- **Override**：带审计的人工修正层，不修改源数据。

### 2. 身份与合并

- Model Version 内部 ID 用稳定的 opaque 键：`mv_` + canonical_model_id 的 slug；canonical 缺失时用 `mv_` + provider + provider_model_id；冲突加后缀。展示名可变，ID 不变。
- `canonical_model_id` 是首选跨源中心键；canonical 不同 = 不同 Model Version。日期快照、provider 别名、推理档位挂在同一版本下；推理档位是 Condition，不是新模型。
- 不做名称模糊匹配。canonical 缺失、Arena name/org 匹配、AA 外链匹配全部走人工 Crosswalk；匹配不上就保留为未匹配，不硬并。
- Family 只是可选分组属性，不参与身份键。
- Offer 的内部 ID 用 provider + provider_model_id；provider_model_id 变化则新建 Offer，旧 Offer 标 deprecated。

### 3. Offer 与价格

- Offer 保存原始字段：input / output / cache_read / cache_write / context tiers / currency / source / last_verified / status；另存上下文限制与原始推理选项。
- 价格以源数据币种存储（models.dev 为 USD）；CNY 只在展示层按汇率 + 日期折算，不落库。
- 模型页价格摘要：分 input / output 显示区间或最低价，不做 blended price；逐供应商表展示完整字段，默认按 output 价格升序，缺失排最后。
- 缺失价格 = 「未公布」，不是 $0；价格 0 = 「免费」；无 Offer 且 open_weights = 「可自托管」。
- 上下文阶梯价保留 tiers，不压平；batch / audio 字段保留但不进首版对比表。
- Provider kind 为 first_party / cloud / gateway；默认只展示 first_party + 主流云，gateway 折叠或后续开放。

### 4. 评测分数

- Score 字段：model_version_id、source、board、condition、rating、rank、ci_lower / ci_upper、variance、vote_count、snapshot_date、source_ref。
- 只嵌入 Arena `text` + `webdev`；用 `latest` split；不跨榜比较。
- 同一模型多个推理档位 = 多条 Score，`condition` 区分；不聚合、不取最高分。
- 未匹配的 Arena 行保留为 Unmatched Entry，在榜单展示但不链模型；人工 Crosswalk 可后续补链。
- AA 不是 Score 来源；Model Version 只存一个可空的 `aa_url` 外部链接，缺失时回退 AA 总榜。

### 5. 状态与生命周期

- Offer `status`：`available_unmarked`（源 status 为 null）、`beta`、`alpha`、`deprecated`。
- Model Version `availability`：`available`（≥1 个非 deprecated Offer）、`deprecated`（全部 deprecated）、`mixed`（部分 deprecated 部分可用）、`open_weights_only`（无 Offer 且 open_weights）、`unknown`（无 Offer 且无 open_weights 信息）。
- beta / alpha 作为模型页 badge，不改变 availability 的取值。
- 「可用（未标记）」是 `available_unmarked` 的用户文案；不把 null 静默说成 active。

### 6. 快照与人工覆盖

- 每条记录带 `source_refs`、`fetched_at`、`snapshot_id`；MVP 只保留最新快照，不做历史趋势。
- Override 存储 target_type / target_id / field / value / reason / author / created_at / source_url（可选）；构建时叠加，源数据不被静默修改。
- 允许覆盖：Crosswalk、AA 外链、Provider kind、推理等级展示标签、价格纠错、状态纠错、Family / 别名。
- 默认源数据优先；Override 必须带原因和来源，价格 / 推理除非有明确纠错依据，否则不改。

### 7. 术语

见根目录 `GLOSSARY.md`。
