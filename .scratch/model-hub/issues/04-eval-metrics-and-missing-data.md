# 评测指标与缺失数据策略

Type: grilling
Status: resolved
Blocked by: 01, 12

## Question

首版展示哪些评测指标、如何排序、缺失时怎么办，才能既帮助选型又不制造虚假精度？

需要定下：

- **指标集合**：Arena `text` + `webdev` 的 rating / rank / 置信区间 / vote count；哪些进探索表默认列，哪些只进详情 / 榜单；首版没有 speed / TTFT 数据；是否做「Arena rating × 价格」的成本-能力散点图。
- **来源与口径**：Arena HF `latest` split 的来源、更新时间、样本 / 投票数如何展示；text 与 webdev 不跨榜混合排序；默认排序用什么；AA 只作为外部链接，不进入任何评分列。
- **缺失数据**：模型没有 Arena 分数时显示「未收录」还是隐藏；是否影响排序；如何避免用户把缺失误读为差。
- **多档位与未匹配**：同一模型多个推理条件（high / max 等）在表 / 详情 / 榜单各怎么展示；Arena 未匹配到 Model Version 的原始行是否保留在榜单、如何标注。
- **文案**：如何用中文解释 Arena rating（偏好评分，不叫 Elo）、置信区间、text / webdev 不可直接比较、AA 外链、数据日期，避免误导。

约束：只嵌入 Arena `text` + `webdev`，不做自定义综合总分；AA 只外链、不调用 API、不展示 AA 分数；首版不纳入 LiveBench / SWE-bench；数据源结论见「数据源可得性、授权与字段」和「评测数据源组合与 AA 授权策略」。产出应能直接支撑榜单页和详情页的评测区。

## Answer

**决定（2026-10-26）**

### 1. 指标集合

- 只嵌入 Arena `text` + `webdev`，使用 `latest` split。
- 每个 Score 展示：rating、置信区间（lower / upper）、rank、vote count、condition、snapshot date。
- 不用 AA 指标、不做 speed / TTFT、不做跨榜综合分、不做成本-能力散点。
- AA 只在模型详情保留「外部评测」链接；不是 Score，不参与排序 / 筛选。
- 价格、上下文、推理等级是模型 / Offer 属性，不是 Score；可作为表格上下文列。

### 2. 术语与排序

- 文案统一用「Arena rating（偏好评分）」，不叫 Elo / 准确率。
- `text` 与 `webdev` 是两个独立 Board，不跨榜比较。
- rank 是 Board 内名次，受榜单组成影响，只作次要信息。
- 置信区间表示不确定性；区间重叠时不宣称显著优劣。
- 默认排序：rating 降序；并列按 rank，再按 release date / name 稳定排序。
- 缺失分数排最后；排序不静默排除模型。

### 3. 探索表

- 默认列：Model（名称 + Lab + 状态徽标）、Context、Price（input / output）、Reasoning、Arena text rating（CI）、Arena webdev rating（CI）。
- rank / vote count 作为 tooltip 或详情信息，不做默认列。
- 默认按 Arena text rating 降序；可切换 newest / price / context 排序。
- 无 Arena 分数的模型保留在目录，显示「未收录」，默认排最后；不显示为 0。
- 移动端隐藏次要列（具体断点由「信息架构与核心交互」定）。

### 4. 模型详情

- 评测区分 text / webdev 两块，分别展示该模型的所有 condition 行：rating、CI、rank、vote count、condition、快照日期。
- 不聚合 condition，不跨榜汇总。
- 某榜无分数：显示「Arena 未收录」+ Arena 外链，不显示空分数。
- AA 外链单独放在「外部评测」卡片；不展示 AA 分数。
- 价格 / 上下文 / 推理等级仍按领域模型展示；不与 rating 混成一个综合结论。

### 5. 榜单页

- `text` / `webdev` 两个独立榜，默认 `text`，可切换。
- 保留 Arena 全部原始行：多 condition 行分别展示；未匹配行标「未匹配」，显示原始 name + organization，不链模型页。
- 默认按 rank 升序（rating 降序）展示，前 50 条 + 搜索；更多结果分页 / 加载由「信息架构与核心交互」定。
- 每行展示：rank、模型（匹配则链接）、Lab / Organization、rating + CI、condition、vote count。
- 页面级展示 Arena 来源、快照日期、CC BY 4.0 署名；不展示跨榜总排名。

### 6. 缺失数据与文案

- 「未收录」不等于能力差：模型表保留，排序沉底，详情给外链。
- 文案解释：Arena rating 是偏好评分，不是准确率；`text` / `webdev` 不可直接比较；CI 表示不确定性；rank 随榜单变化；vote count 越低参考价值越弱；数据来自 Arena HF，更新日期可见；AA 是外部参考。
- 不插补、不平均、不把缺失当 0。
