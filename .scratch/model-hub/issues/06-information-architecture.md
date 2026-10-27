# 信息架构与核心交互

Type: grilling
Status: resolved
Blocked by: 03, 04, 05

## Question

四个核心视图（探索对比表、模型详情、并排对比、榜单）各自解决什么问题、如何互相跳转，才能让开发者在一屏内完成「筛选 → 理解 → 比较 → 判断」？

需要定下：

- **首页 / 探索表**：默认列、可筛选字段（供应商、价格、上下文、推理等级、模态、开源、评测覆盖等）、排序、搜索、分组、空状态；首屏是否给「默认推荐 / 热门」入口。
- **模型详情**：信息分区与顺序（概览、价格 / 报价、上下文与限制、推理等级、能力、评测、来源与更新时间）；如何处理多供应商报价和缺失数据。
- **并排对比**：最多几个模型、对比哪些字段、差异高亮、缺失值、分享链接 / URL 状态。
- **榜单**：分类、榜单与模型详情的联动、来源说明、更新时间；是独立页还是详情页 tab。
- **全局**：导航、URL 结构、移动端优先级、中文文案与数字格式、数据新鲜度 / 来源的展示位置。
- 明确 MVP 不做哪些交互，避免范围蔓延。

约束：只读、公开、中文；四个视图必须在 MVP；数据口径以「领域模型与跨源合并规则」和「评测指标与缺失数据策略」为准。产出是一份可交给低保真原型和最终规格的信息架构说明。

## Answer

**决定（2026-10-26）**

### 1. 页面地图与导航

- `/`：探索表（首页），不是营销落地页。
- `/models/[lab]/[model]`：模型详情；slug 由 canonical_model_id 生成，fallback 用 provider/model 复合键。
- `/compare?models=slug1,slug2,slug3`：并排对比，最多 3 个；URL 可分享。
- `/leaderboards` → 默认跳 `/leaderboards/text`；`/leaderboards/webdev` 独立。
- 顶部导航：「模型」→ `/`；「榜单」→ `/leaderboards/text`。对比不是一级导航，是表格 / 详情里的动作 + 底部托盘。
- 所有筛选 / 排序 / 搜索状态写入 URL query；返回结果保留状态。
- 门户不设「热门 / 编辑推荐」入口；首屏由透明的 Arena text 排序驱动。

### 2. 探索表（首页）

- 默认列：Model（名称 + Lab + 状态 / 开源徽标）、Context、Price（USD input / output）、Reasoning、Arena text（rating + CI）、Arena webdev（rating + CI）。
- 行点击进详情；最左 checkbox 加入对比；列头可排序（默认 Arena text rating 降序，缺失最后；并列按 rank / release date / name）。
- 默认不分组；Lab 作为列内信息和筛选项，避免分组打断排序。
- 搜索覆盖模型名 / Lab / 家族 / 别名。
- 左侧筛选栏（桌面，可折叠）/ 移动端抽屉：
  - 实验室（多选）
  - 托管商（「更多」；按是否有该 provider 的 Offer 过滤）
  - 输出价格上限（USD；预设 ≤$1 / ≤$5 / ≤$15 / 不限）
  - 最低上下文（32K / 128K / 256K / 1M）
  - 支持推理（开关）
  - 开源权重（开关）
  - 仅稳定版（隐藏 beta / alpha）
  - 只看有评测（隐藏无 Arena 分数的模型）
- 首版不做模态筛选；输入模态在详情展示。
- 有筛选时显示 active chips + 「清除全部」。
- 结果为空：「没有符合条件的模型」+ 清除筛选。
- 展示全部 43 个种子模型，不做分页；未来增长再由技术票决定。
- 排序选项：Arena text（默认）/ Arena webdev / newest / price / context；排序控件在表格上方。
- 表格下方保留数据更新时间与来源小字。

### 3. 模型详情

- Header：名称、Lab、canonical ID（小字）、status / availability / open weights 徽标、「加入对比」按钮。
- 关键事实条：input / output 价格区间（USD + CNY）、context、reasoning、Arena text / webdev（如有）。
- 报价表：Provider、kind、status、input / output / cache、context、reasoning options、来源 / 校验时间；默认按 output 价格升序，缺失最后；gateway / deprecated 默认折叠，提供开关；缺失价格「未公布」，0「免费」，无 Offer + open_weights「可自托管」。
- Arena 区：text / webdev 分开；每行 rating + CI + rank + vote count + condition + 快照日期；不聚合、不跨榜；无分数显示「Arena 未收录」+ 外链。
- 外部评测卡片：AA 外链（有稳定 URL 则模型页，否则总榜）；不展示 AA 分数。
- 能力与模态：输入 / 输出模态、tool call、structured output、knowledge cutoff、release date、open weights、license（有则显示，无则「未提供」）。
- 来源与更新时间：页脚数据说明 + 每个关键区块小字来源。
- 详情页单页滚动，不用 tab。

### 4. 并排对比

- 最多 3 个 Model Version；从表格 checkbox 或详情「加入对比」进入；底部托盘显示已选 chips、计数 n/3、清空、去对比。
- 超过 3 个阻止并提示「最多 3 个」。
- `/compare?models=...` 可分享；未知 / 失效 slug 友好提示。
- 对比字段：名称 / Lab / 状态、input / output 价格区间（USD 主 + CNY 次）、context、reasoning、Arena text、Arena webdev、open weights、release date、availability、AA 外链。
- 差异高亮；缺失「—」；不做「赢家」结论；每列链接回详情。
- 移动端横向滚动 + 固定字段列；空状态「从模型表或详情页加入最多 3 个模型」。
- 首版不从榜单直接加入对比；榜单行先到详情。

### 5. 榜单

- `/leaderboards` 默认 text；text / webdev 两个独立 board，board switcher；页面级说明「Arena rating 是偏好评分，不能跨榜比较」。
- 默认前 50 + 搜索；「显示更多」每次加载 50；不无限滚动。
- 列：rank、Model（匹配则链接）、Lab / Organization、rating + CI、condition、vote count。
- 未匹配行标「未匹配」，显示原始 name + organization，不链模型页；仍按 rank 展示。
- 来源 / 快照日期 / CC BY 4.0 署名在页面顶部或底部。
- 移动端用紧凑列表 / 卡片，保留 rank、模型、rating、condition。
- 不提供跨榜总排名。

### 6. 全局、移动端、格式

- 移动端：探索表变卡片列表（Model、Lab、状态、价格、context、Arena text / webdev、加入对比）；筛选抽屉；详情全屏；对比横向滚动；榜单紧凑列表。
- URL：英文 slug；中文只做显示。
- 币种：表格 USD；详情 / 报价表 / 对比 USD 主 + CNY 折算（汇率 + 日期）；不做全局切换。
- 数字：context 128K / 1M；rating 1 位小数；CI 用 ± 或区间；日期 YYYY-MM-DD；金额千分位。
- 数据来源：页脚统一说明 + 表格 / 详情的区块级来源小字；具体许可文案由合规票定。
- 空状态：无结果、无报价、无 Arena 分数、对比为空、榜单搜索无结果都有明确文案和下一步动作。
- 无障碍：表格语义、键盘可达、焦点可见；具体由技术票验收。

### 7. MVP 不做的交互

- 账号、收藏、保存视图、提醒、评论、社区评分。
- 自定义列、拖拽排序、表格分组、CSV 导出、开放 API。
- AI 推荐 / 按任务选型向导 / 成本计算器。
- 跨榜综合分、速度 / TTFT、成本-能力散点。
- 从榜单直接加入对比、无限滚动、暗色模式（原型可探索，但不作为 IA 必需项）。
- 供应商页、模型家族页、多语言。
