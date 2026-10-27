# Model Hub — 首批模型清单

- 快照：models.dev `api.json`，2026-10-26
- 规模：43 个 Model Version / 20 个实验室
- 入选规则：文本输出 LLM；beta / alpha 收但带徽标；deprecated-only 不收；至少一个 Offer 或 `open_weights=true`；不要求 Arena 覆盖。
- 供应商范围：第一方实验室 + 主要云平台；gateway 默认折叠，只有 gateway Offer 的模型例外（标「仅网关」）。
- 价格：USD / 1M tokens；取展示范围，不是最终结算价；0 表示有免费报价，— 表示未公布。
- Arena 覆盖：暂不作为入选条件；接入 Arena HF 数据后校验并写入。

| 实验室 | 模型 | Canonical ID | 状态 | 推理 | 开源权重 | 价格 input/output | 供应商 |
|---|---|---|---|---|---|---|---|
| OpenAI | GPT-6.1 Sol | openai/gpt-6.1-sol | stable | Y | N | $2.00–$2.20 / $10.00–$11.00 | amazon-bedrock, azure, openai |
| OpenAI | GPT-6 Sol | openai/gpt-6-sol | stable | Y | N | $2.00–$2.20 / $10.00–$11.00 | amazon-bedrock, azure, openai |
| OpenAI | GPT-6 Luna | openai/gpt-6-luna | stable | Y | N | $0.10–$0.11 / $0.50–$0.55 | amazon-bedrock, azure, openai |
| OpenAI | GPT-6 Astra | openai/gpt-6-astra | stable | Y | N | $10.00–$11.00 / $50.00–$55.00 | amazon-bedrock, azure, openai |
| Anthropic | Claude Opus 5.5 | anthropic/claude-opus-5-5 | stable | Y | N | $4.00–$4.40 / $20.00–$22.00 | amazon-bedrock, anthropic, azure 等 |
| Anthropic | Claude Sonnet 5.5 | anthropic/claude-sonnet-5-5 | stable | Y | N | $2.00–$2.20 / $10.00–$11.00 | amazon-bedrock, anthropic, azure 等 |
| Anthropic | Claude Haiku 5.5 | anthropic/claude-haiku-5-5 | stable | Y | N | $0.10–$0.11 / $0.50–$0.55 | amazon-bedrock, anthropic, azure 等 |
| Anthropic | Claude Fable 5.1 | anthropic/claude-fable-5-1 | stable | Y | N | $10.00–$11.00 / $50.00–$55.00 | amazon-bedrock, anthropic, azure 等 |
| Google | Gemini 3.8 Flash | google/gemini-3.8-flash | stable | Y | N | $0.75 / $3.75 | google, google-vertex |
| Google | Gemini 3.5 Flash Lite | google/gemini-3.5-flash-lite | stable | Y | N | $0.30 / $2.50 | google, google-vertex |
| Google | Gemini 3.1 Pro (Preview Custom Tools) | google/gemini-3.1-pro-preview-customtools | beta | Y | N | $2.00 / $12.00 | google-vertex |
| xAI | Grok 4.7 | xai/grok-4.7 | beta | Y | N | $2.00–$2.20 / $6.00–$6.60 | amazon-bedrock, azure, google-vertex 等 |
| xAI | Grok 4.5 | xai/grok-4.5 | stable | Y | N | $2.00 / $6.00 | xai |
| Mistral | Mistral Large 4 | mistral/mistral-large-4 | beta | Y | N | $1.36 / $4.18 | mistral |
| Mistral | Mistral Medium (latest) | mistral/mistral-medium-latest | stable | Y | Y | $1.50 / $7.50 | mistral |
| Mistral | Codestral 2508 | mistral/codestral-2508 | stable | N | N | $0.30 / $0.90 | google-vertex, mistral |
| Cohere | Command A+ | cohere/command-a-plus-05-2026 | stable | Y | Y | $2.50 / $10.00 | cohere |
| Meta | Muse Wonder | meta/muse-wonder-1.0 | stable | Y | N | $4.00 / $20.00 | meta |
| Meta | Muse Spark 1.1 | meta/muse-spark-1.1 | stable | Y | N | $1.25 / $4.25 | meta |
| Meta | Muse Glimmer 30B | meta/muse-glimmer-30b | stable | Y | Y | 免费 | nvidia |
| DeepSeek | DeepSeek V4.1 Flash 1017 | deepseek/deepseek-v4.1-flash-1017 | beta / mixed | Y | Y | $0.15–$0.60 / $0.60–$3.60 | deepseek, thinkingmachines |
| DeepSeek | DeepSeek V4 Pro 0813 | deepseek/deepseek-v4-pro-0813 | beta / mixed | Y | Y | $0.66–$1.34 / $1.98–$4.01 | deepseek, volcengine |
| Alibaba / Qwen | Qwen3.8 Max | alibaba/qwen3.8-max | stable | Y | N | $1.78–$2.00 / $5.33–$6.00 | alibaba, alibaba-cn |
| Alibaba / Qwen | Qwen3.8 Flash | alibaba/qwen3.8-flash | stable | Y | N | $0.12–$0.15 / $0.40–$0.47 | alibaba, alibaba-cn |
| Alibaba / Qwen | Qwen3.8 Omni Flash | alibaba/qwen3.8-omni-flash | stable | Y | N | $0.11–$0.15 / $0.38–$0.47 | alibaba, alibaba-cn |
| Alibaba / Qwen | Qwen3.8 27B | alibaba/qwen3.8-27b | beta | Y | Y | $0.70 / $5.59 | thinkingmachines |
| Zhipu / GLM | GLM 5.3 | zhipuai/glm-5.3 | beta | Y | Y | $0–$3.78 / $0–$12.15 | alibaba-cn, amazon-bedrock, mistral 等 |
| Zhipu / GLM | GLM 5.3 Flash | zhipuai/glm-5.3-flash | beta | Y | Y | $0–$0.84 / $0–$2.11 | mistral, nvidia, thinkingmachines 等 |
| Zhipu / GLM | GLM 4.7 FlashX | zhipuai/glm-4.7-flashx | stable | Y | Y | $0.07–$0.07 / $0.40–$0.45 | zai, zhipuai |
| Moonshot / Kimi | Kimi K3.1 Pro | moonshotai/kimi-k3.1-pro | stable | Y | N | $1.94–$4.00 / $10.00–$20.33 | moonshotai, moonshotai-cn |
| Moonshot / Kimi | Kimi K3 | moonshotai/kimi-k3 | beta / mixed | Y | Y | $0–$3.30 / $0–$16.50 | alibaba, alibaba-cn, amazon-bedrock 等 |
| ByteDance / Seed | Seed Evolving | bytedance-seed/seed-evolving | stable | Y | N | $0.89 / $4.45 | volcengine |
| ByteDance / Seed | Seed Character | bytedance-seed/seed-character | stable | Y | N | $0.12 / $0.30 | volcengine |
| ByteDance / Seed | Seed 2.1 Pro | bytedance-seed/seed-2.1-pro | stable | Y | N | $0.89 / $4.45 | volcengine |
| StepFun | Step 3.5 Flash 2603 | stepfun/step-3.5-flash-2603 | stable | Y | Y | $0.10–$0.10 / $0.30–$0.31 | stepfun, stepfun-ai |
| Xiaomi | MiMo V2.6 Pro | xiaomi/mimo-v2.6-pro | stable | Y | Y | $0.43 / $0.87 | xiaomi |
| Xiaomi | MiMo V2.6 Flash | xiaomi/mimo-v2.6-flash | stable | Y | Y | $0.14 / $0.28 | xiaomi |
| Tencent | Hy4 Preview | tencent/hy4-preview | stable | Y | Y | $0.83 / $2.50 | tencent-tokenhub |
| NVIDIA | Nemotron 3.5 Super VL 120B A12B | nvidia/nemotron-3.5-super-vl-120b-a12b | stable | Y | Y | $0–$0.57 / $0–$1.44 | nvidia, thinkingmachines |
| Amazon | Nova 2 Lite | amazon/nova-2-lite | stable | Y | N | $0.30–$0.40 / $2.50–$3.31 | amazon-bedrock |
| Sakana | Fugu Max | sakana/fugu-max | stable | Y | N | $2.00–$2.12 / $6.00–$6.35 | 仅网关 |
| Upstage | Solar Pro 4 | upstage/solar-pro4 | stable | Y | N | $0.30 / $1.20 | upstage |
| Inception | Mercury 3 | inception/mercury-3 | stable | Y | N | $0.10 / $0.35 | inception |

## 未纳入说明

- **MiniMax / Baidu**：当前第一方主力报价多已 deprecated，或只有网关报价；数据保留，后续有当前模型再加。
- **全量 models.dev**：只做策展目录，不把 8,940 条供应商 × 模型记录平铺。
- **gateway**：默认折叠；仅网关模型是例外，需要标注来源。

## 维护规则

- 白名单实验室内、符合入选标准的新模型，在下一份每日快照自动进入；不逐个人工审核。
- deprecated-only 模型从探索表 / 榜单隐藏；详情页可保留弃用横幅（是否 noindex 由 SEO 票定）；数据保留。
- beta / alpha 正常展示，带徽标；可提供「仅稳定版」筛选（由信息架构票定）。
- 新实验室 / 新 provider 需要人工加入白名单；gateway-only 模型需单独标注。
- 每周人工检查 crosswalk、AA 外链和异常；不阻塞每日同步。
