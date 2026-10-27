# Model Hub

一个面向中文开发者的只读模型信息市场：把模型版本、供应商报价、推理能力与 Arena 评测放在同一个选型面上。

## Language

**Model Family**:
一组同源模型版本的集合，例如 Claude、GPT、Gemini、Qwen。
_Avoid_: 模型系列、产品线

**Model Version**:
一个 canonical lab/model 身份的模型版本；供应商报价和评测分数都挂在它下面。
_Avoid_: 模型、模型条目、model

**Canonical Model ID**:
models.dev 提供的 `lab/model` 形式跨供应商标识，是模型版本的首选身份键。
_Avoid_: 全局 ID、模型 ID

**Lab**:
模型版本的原始创建方，例如 Anthropic、OpenAI、DeepSeek；Lab 不等于 Provider。
_Avoid_: 厂商、供应商

**Provider**:
提供模型托管服务的组织；首版分为 first-party、cloud、gateway 三类。
_Avoid_: 供应商、厂商、平台

**Provider Kind**:
Provider 的类型：第一方实验室、云平台或网关。
_Avoid_: 供应商类型（模糊）

**Offer**:
某个 Provider 对某个 Model Version 的一次托管报价，包含价格、上下文限制、推理选项和状态。
_Avoid_: 报价、价格、上架记录

**Score**:
某个评测来源在某个 Board 和 Condition 下对一个 Model Version 的评分。
_Avoid_: 评测、分数、排名

**Board**:
评测来源内的一个独立榜单，例如 Arena 的 text 或 webdev。
_Avoid_: 榜单、分类

**Arena Rating**:
Arena 对模型偏好的相对评分，不是准确率或 Elo；不同 Board 的 rating 不可直接比较。
_Avoid_: Elo、准确率、综合分

**Confidence Interval**:
评分的不确定性区间；用于提示差异是否可靠，不用于推断绝对能力。
_Avoid_: 误差、方差

**Rank**:
Arena 在某个 Board 内的名次，受榜单组成影响，只作次要信息。
_Avoid_: 排名分、Elo

**Vote Count**:
产生评分所依据的投票数，是信任度信号，不是质量分。
_Avoid_: 样本分、票数分

**Leaderboard**:
站内按某个 Board 和 Score 排序展示的页面，不是上游数据实体。
_Avoid_: 排行、榜单

**Catalog**:
站内可浏览的 Model Version 集合，连同它们的 Offer 与 Score 视图；不是上游数据实体。
_Avoid_: 模型列表、数据库

**Explore Query**:
用户在探索表上形成的一组搜索、筛选与排序条件；可分享、可刷新。榜单搜索不属于 Explore Query。
_Avoid_: 页面状态、筛选器、filter state

**Compare Set**:
用户选中的一组 Model Version，最多 3 个，用于并排比较。
_Avoid_: 对比列表、候选集

**Condition**:
评分对应的运行条件，例如推理档位 high 或 default；Condition 不是 Model Version。
_Avoid_: 变体、档位

**Source**:
提供数据的上游来源，例如 models.dev、Arena HF、人工维护。
_Avoid_: 数据源、来源

**Snapshot**:
某次从 Source 抓取并固化的数据版本。
_Avoid_: 版本、缓存

**Manifest**:
一次快照的来源、时间、版本、校验状态与文件清单；站点构建据此判断数据是否可用。
_Avoid_: 配置、索引

**Stale**:
Snapshot 超过预期更新间隔的状态；只提示刷新时间，不隐藏数据。
_Avoid_: 过期、失效

**Crosswalk**:
跨来源的身份映射表，例如 Arena 的 name + organization 到 Model Version。
_Avoid_: 映射表、匹配表

**Override**:
在不修改源数据的前提下，对某个字段的人工修正记录，带原因和审计信息。
_Avoid_: 补丁、覆盖、手工数据

**Availability**:
模型版本在 API 侧的可获得状态：可用、已弃用、混合、仅自托管、未知。
_Avoid_: 状态、生命周期

**Unmatched Entry**:
无法映射到 Model Version 的榜单原始行，仍可在榜单展示，但不链到模型页。
_Avoid_: 未匹配模型、孤儿数据
