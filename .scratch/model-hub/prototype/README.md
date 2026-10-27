# Model Hub — 低保证真原型

## 怎么打开

直接双击 `index.html`，或在当前目录运行：

```bash
python3 -m http.server 8765
```

然后访问 <http://127.0.0.1:8765/>。

- 视觉方向：`?variant=A`、`?variant=B`、`?variant=C`，也可以点底部浮动条或用 ← → 切换。
- 视图：`?view=explore` / `detail` / `compare` / `leaderboard`；详情用 `model=`，对比用 `models=`，榜单用 `board=text|webdev`。
- 右下角「场景」有 5 个可点击的验证路径；「重置原型」恢复初始状态。

## 三个视觉方向

- **A · Workbench**：左侧筛选 + 高密度表格，最工具化，适合“每天来筛模型”的用户。
- **B · Cards**：顶部筛选 + 卡片网格，更易扫读，适合更宽的用户群，但表格对比效率低一些。
- **C · Editorial**：榜单 hero + 编辑式排版，强调排名和叙事，适合内容/品牌驱动，但不如 A 像工作台。

三个方向共享同一套数据口径和四个视图，差异在信息层级、密度和主 affordance。

## 四个视图

- **探索表**：默认 Arena text rating 降序，缺失最后；支持实验室、输出价、上下文、推理、开源、稳定版、有评测筛选。
- **模型详情**：Header → 关键事实 → 托管报价（网关 / 已弃用折叠）→ Arena text / webdev → 能力与模态 → AA 外链 → 来源。
- **并排对比**：最多 3 个；关键字段并排；差异高亮但不判定赢家；缺失显示「—」。
- **榜单**：Arena text / webdev 两个独立 board；rating + CI + rank + condition + votes；未匹配行保留但不链模型页。

## 数据

- 12 个样例模型来自 **models.dev 2026-10-26 快照**；价格、上下文、推理选项、模态、知识截止等为真实字段。
- Arena 分数来自 **lmarena-ai/leaderboard-dataset**：
  - text 用 `category=overall`；
  - webdev 用 `category=webdev`（不是 `webdev-react` / `webdev-html` / `image_to_webdev`）；
  - 取最新 `leaderboard_publish_date` 后按 vote_count 选代表行；
  - 保留真实的 condition、CI、rank、votes、日期。
- 缺失样例：Claude Haiku 5.5 无 text 分数；Grok 4.7 无 text 分数；榜单里的 Gemini 4 Argon 是未匹配行，保留但不链模型。
- 报价折叠样例：Kimi K3、DeepSeek V4 Pro 0813 含网关 / 已弃用报价；默认只显示第一方 + 云平台。
- 价格单位 USD / 1M tokens；价格区间只基于第一方 + 云平台，gateway 不参与摘要。

## 已知限制

- 无持久化；筛选和对比状态在刷新后重置（对比页 URL 可分享）。
- 只加载 12 个样例，不代表完整 43 个首批清单。
- 没有真实路由、SEO、无障碍完整实现；这是低保证真，不是生产代码。
- AA 只放外部链接，不调用 API、不展示 AA 分数。
- **数据管道注意**：Arena `webdev/latest` 含多个 category 和多条 publish_date；正式管道必须按 category 过滤并选择最新快照。已写入「数据管道与更新策略」票。

## 希望得到的反馈

1. 三个方向里哪个最接近你想要的产品？想混合哪些部分？
2. 表格密度、筛选位置、默认排序是否合适？
3. 详情页顺序是否符合“先决策、后规格”？缺什么？
4. 对比最多 3 个、字段选择是否够用？
5. 缺失数据、报价折叠、移动端卡片是否清楚？
