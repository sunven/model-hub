# 数据管道与更新策略

Type: grilling
Status: resolved
Blocked by: 01, 03

## Question

首版如何从各数据源生成并更新站内快照，才能做到可追溯、可降级、可人工修正，而不过度工程化？

需要定下：

- **同步方式**：构建时抓取 vs 定时任务（GitHub Actions / 本地脚本）生成 JSON；首版是否需要数据库 / 后端。
- **频率**：models.dev 基础信息、价格、评测分数各自多久更新；如何展示「最后更新时间」。
- **来源失败 / 字段变更**：重试、缓存、降级、告警（最小方案）；某源长期不可用时的外链 / 隐藏策略。
- **人工修正**：哪些字段允许覆盖（推理等级、映射、价格？）；覆盖如何记录和审计；如何避免下次同步被冲掉。
- **快照与版本**：是否保留历史快照；MVP 是否只保留最新；如何保证构建可复现。
- **数据校验**：必填字段、价格 / 上下文合理性、跨源映射完整性、重复模型检测。

约束：免费公开数据、定期快照；不建复杂后端；首版以静态站点为目标。产出应能直接支撑技术规格和最终验收。

## Known data issues（2026-10-26 原型构建发现）

- Arena `webdev/latest` 不是一个单一榜：包含 `webdev`、`webdev-react`、`webdev-html`、`image_to_webdev` 等 category；MVP 只取 `category=webdev`。
- text 用 `category=overall`。
- 同一 category / 模型存在多条 `leaderboard_publish_date` 行；管道需选最新 publish_date，再按 vote_count / 去重规则确定唯一 Score，并把 snapshot/date 写入 Score。
- 原型用了 2026-10-22/23 的最新行；正式管道不得把所有 category 或日期平铺。

## Answer

**决定（2026-10-26）**

### 1. 架构与调度

- 独立数据脚本（Node / TS 或与站点同栈，具体由技术栈票定）负责抓取、归一化、校验、写快照；站点只读 `data/latest/*.json`，无数据库 / 后端。
- GitHub Actions 每日约 03:30 UTC 运行 + `workflow_dispatch` 手动触发；其他 CI 可替换，数据契约不变。
- 频率：models.dev 每日一次（源近乎每小时，但选型站不需要小时级）；Arena HF 每日一次（源约每日更新，发布日通常滞后 1-2 天）；AA 不抓取，只外链。
- 站点构建只消费已晋级的 `latest`；不在构建时抓源。

### 2. 数据流

- **models.dev**：抓 `/catalog.json`（模型级 + 托管级合并）或 `/api.json` + `/models.json`；按 `canonical_model_id` 建 ModelVersion；生成 Offer；过滤文本输出；套用首批白名单；deprecated-only 隐藏；beta / alpha 保留徽标；provider kind 人工维护；价格 / limit / reasoning 原样归一。
- **Arena HF**：抓 `text/latest` + `webdev/latest` Parquet；text 只取 `category=overall`，webdev 只取 `category=webdev`；按 model / organization / condition 分组；选最新 `leaderboard_publish_date`，同日期取 `vote_count` 最高；保留 unmatched 行；写 condition / CI / rank / votes / date。
- **AA**：不调用 API；ModelVersion 只保留可空 `aa_url` 外链。
- **输出**：`data/latest/models.json`、`offers.json`、`scores.json`、`unmatched.json`、`manifest.json`、`validation-report.json`；配套 `data/launch-set.yml`、`data/crosswalk/*.yml`、`data/overrides/*.yml`、`data/schema/*.json`。
- 每个记录带 `source_refs`、`fetched_at`、`snapshot_id`；manifest 记录各源 URL、ETag / 版本、content hash、记录数、许可 / 署名、状态。

### 3. 失败与晋级

- 抓取：超时 + 指数退避重试；使用 ETag / If-None-Match；源失败不覆盖 latest。
- **校验后原子晋级**：写临时快照 → schema + 引用完整性 + 业务规则校验 → 通过才替换 latest；失败保留上一份 good，CI 失败并通知。
- stale：manifest 记录各源最后成功时间；超过 2× 预期间隔（models.dev >48h、Arena >72h）站点显示 stale warning；不隐藏数据。
- 长期不可用：Arena 隐藏评分区 / 保留最后日期并标注；AA 始终外链；不发布半套数据。
- 保留：latest 在仓库 / 站点；每次运行的原始 + 归一化快照作为 CI artifact 保留 30 天；不做历史库 / 历史 UI。

### 4. 人工覆盖

- 独立 override 文件，字段：target_type / target_id / field / value / reason / author / created_at / source_url（可选）。
- 允许：crosswalk、AA 外链、provider kind、推理等级展示标签、价格 / 状态纠错、family / 别名。
- 源数据默认权威；覆盖在归一化后叠加；同一字段冲突写 validation report；结构错误硬失败，质量 warning。
- 审计：override 文件进 git；manifest 记录本次应用的 override 数量与 hash；不引入 CMS / DB。

### 5. 校验与验收

- Schema：ModelVersion / Offer / Score / Source / Snapshot / Override 的 JSON Schema。
- 硬失败：必填字段缺失、类型错误、引用不存在的 model / provider、Arena 未按 category 过滤、重复 Score、价格 / 上下文为负、manifest 与实际文件不一致。
- Warning：无价格、无 Arena、context 异常、override target 不存在、未匹配行数量异常、价格离群。
- 验收：
  - 相同 raw snapshot + overrides 生成的业务数据字节级稳定（manifest 时间除外）；排序、数字格式固定。
  - 源失败时 latest 不变且 CI 失败可见。
  - 校验失败时 latest 不变。
  - Arena webdev 只含 `category=webdev`；text 只含 `overall`。
  - 43 个首批模型在输出中可追溯；缺失数据保留为空而非 0。

## Consistency addendum（2026-10-27）

- 合规票要求 `data/fx.yml`（USD→CNY rate / as_of）；管道把它作为手动输入原样写入 manifest / 站点数据；超过 14 天由展示层隐藏 CNY。
