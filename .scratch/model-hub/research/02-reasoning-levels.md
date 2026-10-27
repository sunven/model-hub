# 推理等级的数据语义与展示口径

Status: resolved · 2026-10-26 · Ticket: [02](../issues/02-reasoning-levels.md)
Snapshot: `/tmp/models-dev.json`（models.dev API，2026-10-26）

## 结论

- `reasoning`（是否推理）与 `reasoning_options`（可选档位）是两件事：6,806 个推理行中只有 5,660 行（83.2%）给了选项，1,146 行选项为空。
- options 只有三种 `type`：`toggle`、`effort`、`budget_tokens`；同一模型可带多种，它们是同一能力的多种表达，不是独立维度。
- effort 取值是模型特定子集，不是全局八档；最常见只有 `low/medium/high`。`default` 仅 2 行，是异常，不应作为档位。
- budget 边界极不统一：608 条中 201 条无边界、167 条仅 min、44 条仅 max、196 条两者都有。`min=-1` 仅 2 行。
- 建议 MVP 用「可调/固定/未知」做索引，详情页保留原始档位 + 预算范围；不要压成统一 L1–L4 分数。

## 1. 统计口径与覆盖

一行 = 一个 provider 上架的一个模型；232 个 provider，8,940 行。去重后 4,091 个 model id（`canonical_model_id` 仅 622 个不同值）。

| 维度 | 行数 | 占比 |
|---|---:|---:|
| `reasoning=true` | 6,806 | 76.1% |
| `reasoning=false` | 2,134 | 23.9% |
| 推理且 options 非空 | 5,660 | 63.3% |
| 推理且 options 为空 | 1,146 | 12.8%（占推理 16.8%） |
| 非推理却带 options | 0 | 0% |

不变量：`reasoning=false` 时 options 为 `null`；`true` 时为数组（可空）。按 model id 去重：2,829 个推理模型，2,368 个至少一个 provider 有非空 options，1,992 个所有出现行都非空；243 个 canonical 键同时存在「有/空 options」的源。**合并时应取并集并记来源，不能取任意一行。**

5,660 个非空行的组合：仅 effort 3,970；仅 toggle 740；effort+toggle 342；budget+toggle 266；budget+effort 134；仅 budget 127；三者 81。选项条目 6,564。

### effort 分布

| 值 | 行数 | 占推理行 |
|---|---:|---:|
| high | 4,375 | 64.3% |
| low | 3,932 | 57.8% |
| medium | 3,367 | 49.5% |
| max | 2,136 | 31.4% |
| none | 1,782 | 26.2% |
| xhigh | 1,774 | 26.1% |
| minimal | 688 | 10.1% |
| default | 2 | 0.03% |

最常见集合：`low,medium,high` 740；`low,medium,high,xhigh,max` 607；`low,high,max` 381；`none..xhigh` 289；`minimal,low,medium,high` 276。80 行只有一个 effort 值（固定档，不是可调）。

### budget 分布

608 条覆盖 343 个 model id。min 有值 363 条，中位 1,024，常见 1,024（216）、128（56）、1（41）、0（37）、512（9）。max 有值 240 条，中位 63,999，常见 32,768（64）、262,144（44）、63,999（35）、24,576（24）、81,920（19）、131,072（10）。63,999/127,999 共 39 条，是 64K/128K 的 off-by-one 导出。`min=-1` 仅 2 条 NVIDIA Nemotron（均 `max=32768`）。

### 主流 provider（行/推理/非空/空/effort/toggle/budget）

anthropic 17/17/17/0/13/2/8；openai 51/32/32/0/32/0/0；google 38/30/24/6/19/4/3；google-vertex 61/48/42/6/29/9/11；deepseek 4/4/4/0/4/4/0；xai 13/7/5/2/5/0/0；alibaba 53/34/32/2/6/29/27；moonshotai 6/6/4/2/3/1/0；minimax 8/8/2/6/1/1/0；openrouter 390/275/247/28/152/93/12；amazon-bedrock 200/155/140/15/114/78/34；azure 95/61/50/11/48/2/5。

family 行/推理/非空：qwen 1,058/682/532；glm 565/544/466；gpt 421/256/235；claude-opus 376/373/337；claude-sonnet 250/243/220；deepseek-flash 330/328/314；gemini-flash 285/257/227；grok 255/191/145；kimi-k2 244/208/117；llama 199/0/0。family 跨 provider 重复，不可相加。

## 2. 字段语义

schema 只约束形状、不解释语义（[schema.ts](https://github.com/anomalyco/models.dev/blob/dev/packages/core/src/schema.ts)）：toggle 无字段；effort 是八值枚举（可含 null）；budget min 允许 -1、max 非负、min≤max。语义需结合厂商文档。

- **toggle**：二值开关，不含等级。1,429 行带 toggle，740 行仅 toggle。toggle+effort 共 423 行，但仅 23 行 effort 含 `none`——多数情况下 toggle 是唯一关闭方式，不能当冗余字段。
- **effort**：单模型内有序，跨厂商无数值等价。`none`=关闭（OpenAI 明确；GPT-6 Astra 拒绝 none）；`minimal`=最小非零（Google 最低档）；`low/medium/high`=常规档（OpenAI gpt-5.5 默认 medium）；`xhigh/max`=高于 high（OpenAI 顺序 xhigh<max）；`default`=厂商默认，不是强度，仅 2 行，映射为「默认」且不排序。
- **budget_tokens**：思考 token 预算的允许区间，不是推荐值。无边界=未知，不等于无上限；`min=0` 可关到 0（37 条）；`min=128/512/1024` 表示有下限、通常不能完全关闭；`min=-1` schema 允许但无解释（Gemini 生态中 -1 常表动态预算，但此处挂在 NVIDIA 模型上，来源可疑），展示时不要计算。
- **组合**：toggle+effort=开关+档位，先开关后档位；budget+effort 多是两套可选控制面（如 Claude Sonnet 4.6：effort `low..max` + budget `min=1024`），不是笛卡尔积，models.dev 未表达互斥；三者都有（81 行，如 qwen3.8-flash）应保留原始值并标「多套参数」。
- **关闭能力**：5,660 非空行中 3,200 行（56.5%）有明确关闭方式（toggle、effort 含 none、或 budget min=0）；2,460 行（43.5%）数据中无明确关闭项，但只能写「未见关闭选项」，不能断言「始终开启」。

## 3. 厂商文档对照

| 厂商 | 官方口径 | models.dev 映射与缺口 |
|---|---|---|
| OpenAI（[guide](https://developers.openai.com/api/docs/guides/reasoning)） | effort 支持 `none,minimal,low,medium,high,xhigh,max`；none 关闭；gpt-5.5 默认 medium；无 effort→token 表 | openai 32 行全 effort，集合一致；未存默认档；不能假设所有模型接受 none |
| Google（[thinking](https://ai.google.dev/gemini-api/docs/thinking)） | 新模型 `thinking_level`：minimal/low/medium/high；默认按模型不同（2.5 Flash-Lite=Off，3.5 Flash-Lite=minimal，4 Argon=medium）；当前文档无预算数值 | Gemini 3+ 映射为 effort；Gemini 2.5 仍用 budget（Flash 0–24,576、Pro 128–32,768、Flash-Lite 512–24,576）；缺默认档，off 靠 toggle/budget 0 表达 |
| DeepSeek（[docs](https://api-docs.deepseek.com/guides/reasoning_model)） | `thinking:{"type":"enabled"}` + `reasoning_effort`；未列关闭方式/默认值 | 4 行均 toggle+effort `low/high/max`；toggle 是否真能关闭未确认 |
| Anthropic | **未核对**：docs.anthropic.com 301→platform.claude.com，307→地区不可用（未绕过） | 13 行 effort `low..max`、8 行 budget（多为 min=1024）、2 行 toggle；effort/budget 是否互斥、xhigh/max 是否官方值均未验证 |

## 4. 归一化方案

**A. 三态徽标（最轻）**：可调/固定/未知，另标「可关闭」。优点：可读、跨厂商公平、维护最低，适合探索表与筛选。缺点：丢失等级差异，无法回答「谁支持 max」。

**B. 原始档位 + 关闭标记 + 预算范围（最忠实）**：表格显示「可调 high–max」或「固定 high」，详情页列原始 chips + min–max。优点：不发明映射、可追溯，维护只跟快照。缺点：标签异构，用户要学 xhigh/max/minimal，排序筛选需额外规则，跨 gateway 可能不一致。

**C. 统一 L1–L4**：off/none=L1，minimal/low=L2，medium=L3，high/xhigh/max=L4，只显示最高档/区间。优点：可排序、中文用户易懂。缺点：虚假精度（max 与 high 合并）、厂商新增档位就要改映射、必须保留原值否则无法解释。

**建议组合（非最终 UI 决策）**：探索表用 A，详情/对比用 B，C 仅作排序派生字段并标「归一化，非厂商原值」；不建议 C 作为唯一口径。

## 5. 缺失数据与不展示的情况

| 数据形态 | 行数 | 标注建议 |
|---|---:|---|
| `reasoning=false` | 2,134 | 「不支持推理」，不写「无数据」 |
| 推理但 options 为空 | 1,146 | 「等级未提供」，不断言不可调；多为多模态/预览（Gemini 图像/TTS、MiniMax M2、Kimi K2.7 Code），多在 MVP 外 |
| 仅 1 个 effort 值 | 80 | 「固定 high」，不显示为可选 |
| 仅 toggle | 740 | 「可开关，无等级」 |
| budget 无 min/max | 201 条 | 「预算可调，范围未标明」，不写「无上限」 |
| min>0 且无 toggle/none | 多数 budget 行 | 「最低预算 1,024 tokens」，不写「可关闭」 |
| 无明确关闭方式 | 2,460 | 「未见关闭选项」，不写「始终开启」 |
| `default` / `min=-1` | 2 / 2 | 标异常；default 显示「默认」不排序，-1 隐藏数值 |
| 63,999/127,999 | 39 条 | 归一为 64K/128K 或标「约」 |

不建议展示等级：非推理模型；MVP 外的图像/音频/TTS 模型；单一固定档且无更多文档；仅某 gateway 独有而 first-party 无对应项（回退 first-party 或标来源）。

跨源冲突（243 个 canonical 键）：first-party 优先，否则并集；档位集合不同就保留并集并注「不同托管商支持不同档位」，不取平均或默认最大值。

## 6. 对 MVP 的影响

- 数据字段至少：`reasoning_support`（none/fixed/adjustable/unknown）、`reasoning_levels`（有序原值）、`reasoning_can_disable`（true/false/unknown）、`reasoning_budget`（min/max/unknown）、`reasoning_source`（provider + 快照日期）。
- 探索表放三态徽标 + 可关闭小标记；筛选「支持推理 / 等级可调 / 可关闭」；详情页放原始 chips + 预算范围。
- 不做跨厂商数值换算；对比「最高档」时标注归一口径。
- 统计只代表本快照（含 Claude 5、Gemini 4、GPT-6 等 2026 模型），上线前需重跑同一脚本。

## 来源

- models.dev：https://models.dev/api.json 与 [schema.ts](https://github.com/anomalyco/models.dev/blob/dev/packages/core/src/schema.ts)
- OpenAI：https://developers.openai.com/api/docs/guides/reasoning
- Google：https://ai.google.dev/gemini-api/docs/thinking
- DeepSeek：https://api-docs.deepseek.com/guides/reasoning_model
- Anthropic：https://platform.claude.com/docs/en/docs/build-with-claude/extended-thinking（地区拦截，未读取）
