# Model Hub — 数据管道

静态数据管道：下载 sources → 归一化 → override → 校验 → 生成 JSON Schema → 原子晋级 `data/latest`。站点只读取已通过校验的 latest。

## 运行

```bash
npm install
npm run typecheck
npm run data          # 用本地 raw 缓存；缺失时才下载
npm run data:offline  # 强制只用缓存
npm run data:refresh  # 重新下载 models.dev / Arena，并刷新 ECB 汇率
```

`data:refresh` 通过 `curl --http1.1` 下载大文件，并用 Frankfurter 获取 ECB USD→CNY 参考汇率。汇率刷新失败时保留旧值并在校验报告 warning，不会阻断其他数据刷新。

当前 raw 缓存：models.dev `api.json` / `models.json`、Arena text / webdev Parquet，均为 2026-10-27 抓取；`data/raw` 不入库。

## 产出

`data/latest/`

| 文件 | 内容 |
|---|---|
| `models.json` | 43 个 ModelVersion |
| `offers.json` | 1,246 个 Offer（含 gateway） |
| `scores.json` | 61 条 Arena Score（text 30 / webdev 31） |
| `unmatched.json` | 504 条未映射 Arena 行 |
| `manifest.json` | 快照 ID、来源 hash / 时间、许可、FX、override 审计、新鲜度、计数 |
| `validation-report.json` | 校验结果与 warnings |

`data/schema/` 发布 models / offers / scores / unmatched / manifest / overrides / validation-report 的 JSON Schema（Draft 2020-12），由 Zod 生成并在每次管道运行时更新。

当前运行结果：

- 43 个模型 / 20 个实验室
- 33 个模型有至少一条 Arena 分数；10 个没有
- 1 个模型只有 gateway Offer：**Fugu Max**
- 9 个模型带 beta 徽标；3 个模型 availability 为 mixed（DeepSeek V4.1 Flash、DeepSeek V4 Pro、Kimi K3）
- 10 条 warning 都是「模型没有 Arena 分数」：Codestral 2508、Command A+、Fugu Max、GLM 4.7 FlashX、Mercury 3、Qwen3.8 Flash、Qwen3.8 Omni Flash、Seed 2.1 Pro、Seed Character、Seed Evolving
- Crosswalk：verified 33 / tentative 0 / none 10
- Override：0 条（文件与审计机制已就绪）
- 无 hard failure；`data/latest` 已原子晋级

## 数据语义

- **Arena 过滤**：text 只取 `category=overall`，webdev 只取 `category=webdev`；每个 model/org 取最新 `leaderboard_publish_date`，同日期取最高 `vote_count`。
- **Crosswalk**：43 个模型的人工映射在 `data/crosswalk/arena.yml`；只做明确匹配，不做模糊合并。没有匹配的模型显示「未收录」；未匹配 Arena 行保留在 `unmatched.json`。
- **Override**：`data/overrides/overrides.yml` 在归一化后叠加，字段白名单、类型校验、冲突检测、manifest 审计；结构错误硬失败，目标缺失 warning。详见该目录 README。
- **Provider kind 相对模型实验室**：第一方 = 该 lab 自己的平台（Amazon Nova on Bedrock、Gemini on Vertex、ByteDance on Volcengine）；其他主要云平台 = cloud；其余 = gateway。Nvidia 托管 Meta 模型、Alibaba 托管别家模型不会被误标为第一方。
- **Offer 去重**：同 provider + price + limits + status 的重复行合并，保留推理选项最完整的一行；区域价格差异保留为独立 Offer。
- **价格**：USD / 1M tokens；缺失价格 = null；CNY 仅展示层用 `data/fx.yml` 折算。
- **FX**：ECB 参考汇率经 Frankfurter 自动刷新，记录 `as_of`、`source_url` 和抓取时间；超过 14 天 UI 隐藏 CNY。汇率不是交易价格。
- **新鲜度**：models.dev 超过 48 小时、Arena 超过 72 小时，站点顶部提示过期但不隐藏数据；manifest 记录三个来源的年龄与阈值。
- **推理等级**：`ModelVersion.reasoningLabel` 是表格用的四态摘要；原始 `reasoning_options` 在 Offer 上。
- **AA**：不抓取、不嵌入。`data/crosswalk/aa.yml` 覆盖全部 43 个模型：33 个通过公开搜索索引核对到精确模型页（verified），10 个没有精确页（null，UI 回退 AA 总榜）。没有直接访问 AA 页面。
- **Provider 筛选**：Models 的 `providerNames` 只列第一方 / 云平台；`gatewayOnly` 用于「仅网关」筛选。
- **测试**：`npm run test:e2e` 使用 Playwright；CI 使用 Chromium，本地默认 Chrome。另有 axe 可访问性测试和 Lighthouse CI 门禁。

## 失败与保留策略

管道先写 `data/tmp-<snapshot>`，校验通过后原子替换 `data/latest`。硬失败时保留上一份可用快照，并把详细报告写到 `data/validation-report.json`。CI 每日刷新成功后只提交数据与 schema 变更，不自动部署。
