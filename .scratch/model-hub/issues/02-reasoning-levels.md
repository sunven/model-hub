# 推理等级的数据语义与展示口径

Type: research
Status: resolved
Blocked by: none

## Question

models.dev 的 `reasoning_options` 已包含 `toggle`、`effort`（none / minimal / low / medium / high / xhigh / max / default）与 `budget_tokens`（含 min / max，甚至 min=-1）等形态。如何把这些异构选项归一化成用户能理解的「推理等级」，并明确哪些模型支持哪些等级？

需要回答：

1. 统计 8,940 个模型中 `reasoning=true/false`、`reasoning_options` 为空 / 非空、各 effort 值、`budget_tokens` 的覆盖与分布；按主流供应商 / 模型家族给出覆盖率。
2. 解释各字段的语义：`toggle` 表示什么；`none/default` 是否等价于关闭；`xhigh/max` 与 `high` 的差别；`budget_tokens` 的 min/max/-1/无上限如何理解；同一模型同时有 toggle + effort + budget 时如何组合。
3. 对照 2-3 家头部厂商（如 Anthropic、OpenAI、Google、DeepSeek）的官方文档，确认 models.dev 的映射是否准确、有哪些缺口。
4. 给出 2-3 种面向用户的归一化展示方案（例如：离散等级 L1-L4；原始等级 + 预算范围；仅「可调 / 不可调」），比较可读性、准确性和维护成本。
5. 明确哪些模型不值得 / 无法展示等级，以及缺失时如何在 UI 上标注。

产出：`.scratch/model-hub/research/02-reasoning-levels.md`，含数据统计表、语义解释、方案对比与来源。不要做最终 UI 决策。

## Answer

本地快照（2026-10-26，232 provider、8,940 行）：`reasoning=true` 6,806 行（76.1%），其中 5,660 行（83.2%）有非空 `reasoning_options`，1,146 行选项为空；非推理 2,134 行且 options 恒为 null。选项只有 `toggle`（1,429 行）、`effort`（4,527）、`budget_tokens`（608）三种，且会组合出现：仅 effort 3,970、仅 toggle 740，其余为 2–3 种组合。effort 是模型特定子集，不是全局八档；`high/low/medium` 最常见，`default` 仅 2 行（Groq Qwen，异常）。budget 的 608 条中 201 条无边界、167 条仅 min、44 条仅 max、196 条两者都有；min 常见 1,024/128/0，max 常见 32,768/262,144；`min=-1` 仅 2 条 NVIDIA 模型，不应计算为负预算；63,999/127,999 是 64K/128K 的导出偏差。

语义：toggle 是二值开关（toggle+effort 的 423 行中仅 23 行 effort 含 `none`，故 toggle 通常是唯一关闭方式）；effort 单模型内有序、跨厂商无数值等价（`none`=关，`minimal`=最小非零，`default`=厂商默认非档位，`xhigh/max`>high）；budget_tokens 是允许区间而非推荐值，无边界≠无上限，min=0 才表示可关到 0；budget+effort 多是两套可选控制面而非笛卡尔积。5,660 个非空行中 2,460 行（43.5%）没有明确关闭项，只能标「未见关闭选项」，不能断言始终开启。

厂商核对：OpenAI 的 `none..max`、none 关闭、gpt-5.5 默认 medium 与数据一致；Google 新模型用 `thinking_level`（minimal/low/medium/high）而 Gemini 2.5 仍用 budget，数据同时保留两代口径；DeepSeek 文档有 `thinking.enabled` + `reasoning_effort`，但未确认关闭/默认。Anthropic 文档 301→307 地区拦截，未读取，相关 effort/budget 组合只按数据记录、未验证。

展示方案（未做最终 UI 决策）：A 三态徽标「可调/固定/未知」+ 可关闭标记，最轻、适合探索表；B 原始档位 + 关闭标记 + 预算范围，最忠实、适合详情/对比；C 统一 L1–L4，可比但虚假精度、维护高。建议探索表 A、详情/对比 B，C 仅作排序派生并标「归一化」。

完整统计表、字段/组合说明、缺失数据标注与来源见 [research/02-reasoning-levels.md](../research/02-reasoning-levels.md)。
