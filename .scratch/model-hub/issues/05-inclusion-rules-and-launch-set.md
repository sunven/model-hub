# 收录规则与首批模型清单

Type: grilling
Status: resolved
Blocked by: 03, 04

## Question

首版收录哪些模型与供应商，按什么规则纳入 / 排除，才能既覆盖开发者的真实选型面，又不被长尾和废弃模型淹没？

需要定下：

- **纳入标准**：文本 / 推理 LLM；active / beta 是否收；deprecated 是否收；是否有评测覆盖要求；是否要求至少一个可比较的托管报价；开源权重 / 自托管模型如何处理。
- **供应商范围**：国际（OpenAI、Anthropic、Google、xAI、Mistral 等）与中国（DeepSeek、阿里通义、智谱、月之暗面、MiniMax、字节豆包等）各收哪些；以 models.dev 的 provider 为准还是手工白名单。
- **首批规模**：目标模型版本数 / 供应商数；是「精选 30-50 个」还是「覆盖所有主流家族的当前版本」；如何避免同一家族多个快照刷屏。
- **清单产出**：给出一份首批模型版本清单（含 canonical id、供应商、状态、是否有评测、推理选项），并标注取舍理由。
- **维护规则**：新模型何时进入、旧模型何时转为 deprecated / 隐藏。

约束：模型为主、报价为辅；不做全量 models.dev；清单要能支撑原型和规格中的示例数据。产出应可直接用于页面示例和验收。

## Answer

**决定（2026-10-26）**

### 纳入规则

- 文本输出（chat / reasoning）LLM；推理可选；允许图像 / PDF 输入但输出必须是文本。
- beta / alpha 收，带徽标；deprecated-only 不收；mixed 保留，deprecated Offer 标注。
- 至少一个 Offer 或 `open_weights=true`；无 Offer 且无开源权重不收。
- 不要求 Arena 覆盖；无分数按「未收录」处理。
- 开源权重模型收；无 Offer 的标「可自托管」。

### 供应商与规模

- 第一方实验室 + 主要云平台；gateway 默认折叠；只有 gateway Offer 的模型例外并标注。
- 首批 43 个 Model Version / 20 个实验室；清单见 [launch-set.md](../launch-set.md)。
- 每实验室 2-4 个当前主力，避免同家族日期快照刷屏；MiniMax / Baidu 暂不纳入（当前第一方主力 deprecated 或仅网关报价）。

### 维护规则

- 白名单实验室内、符合规则的新模型每日快照自动进入；不逐个人工审核。
- deprecated-only 从探索表 / 榜单隐藏；详情页可保留弃用横幅（noindex 由 SEO 票定）；数据保留。
- beta / alpha 带徽标；「仅稳定版」筛选由信息架构票定。
- 新实验室 / 新 provider 人工加入白名单；gateway-only 模型单独标注。
- 每周人工检查 crosswalk、AA 外链和异常，不阻塞每日同步。

**资产**：[launch-set.md](../launch-set.md)（43 行，含 canonical id、状态、推理、开源权重、价格范围、供应商）。
