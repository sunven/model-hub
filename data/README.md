# Model Hub — 本地数据管道

这是数据优先阶段：只生成并校验本地数据，不包含 Next.js 站点、Cloudflare 或部署。

## 运行

```bash
npm install
npm run typecheck
npm run data          # 用本地 raw 缓存；缺失时才下载
npm run data:offline  # 强制只用缓存
npm run data:refresh  # 用 curl 重新下载 raw 数据
```

`npm run data:refresh` 会用 `curl` 重新下载；当前网络对大文件偶发中断，本地默认用缓存。

当前使用：

- models.dev `api.json` 缓存：`data/raw/models-dev/api.json`（2026-10-27 快照）
- models.dev `models.json` 缓存：`data/raw/models-dev/models.json`（2026-10-27 抓取）
- Arena HF：`data/raw/arena/text-latest.parquet`、`webdev-latest.parquet`（2026-10-27）

## 产出

`data/latest/`

| 文件 | 内容 |
|---|---|
| `models.json` | 43 个 ModelVersion |
| `offers.json` | 1,246 个 Offer（含 gateway） |
| `scores.json` | 61 条 Arena Score（text 30 / webdev 31） |
| `unmatched.json` | 504 条未映射 Arena 行 |
| `manifest.json` | 快照 ID、来源 hash / 时间、许可、FX、计数 |
| `validation-report.json` | 校验结果与 warnings |

当前运行结果：

- 43 个模型 / 20 个实验室
- 33 个模型有至少一条 Arena 分数；10 个没有（见下）
- 1 个模型只有 gateway Offer：**Fugu Max**。Muse Glimmer 30B、Qwen3.8 27B 已通过主要推理云（Nvidia / Vultr / DeepInfra 等）获得可见报价
- 9 个模型带 beta 徽标；3 个模型 availability 为 mixed（DeepSeek V4.1 Flash、DeepSeek V4 Pro、Kimi K3）
- 10 条 warning 都是「模型没有 Arena 分数」：Codestral 2508、Command A+、Fugu Max、GLM 4.7 FlashX、Mercury 3、Qwen3.8 Flash、Qwen3.8 Omni Flash、Seed 2.1 Pro、Seed Character、Seed Evolving
- Crosswalk：verified 33 / tentative 0 / none 10；Muse Glimmer、Step 3.5 Flash 的映射已按名称、组织和唯一变体人工核验
- 无 hard failure；`data/latest` 已原子晋级

## 数据语义

- **Arena 过滤**：text 只取 `category=overall`，webdev 只取 `category=webdev`；每个 model/org 取最新 `leaderboard_publish_date`，同日期取最高 `vote_count`。
- **Crosswalk**：43 个模型的人工映射在 `data/crosswalk/arena.yml`；只做明确匹配，不做模糊合并。没有匹配的模型显示「未收录」；未匹配 Arena 行保留在 `unmatched.json`。
- **Provider kind 相对模型实验室**：第一方 = 该 lab 自己的平台（Amazon Nova on Bedrock、Gemini on Vertex、ByteDance on Volcengine）；其他主要云平台 = cloud；其余 = gateway。Nvidia 托管 Meta 模型、Alibaba 托管别家模型不会被误标为第一方。
- **Offer 去重**：同 provider + price + limits + status 的重复行合并，保留推理选项最完整的一行；区域价格差异保留为独立 Offer。
- **价格**：USD / 1M tokens；缺失价格 = null；CNY 仅展示层用 `data/fx.yml` 折算。
- **FX**：`usd_to_cny: 7.12` 是**本地占位值**，上线前必须替换并复核；超过 14 天 UI 应隐藏 CNY。
- **推理等级**：`ModelVersion.reasoningLabel` 是表格用的四态摘要；原始 `reasoning_options` 在 Offer 上。
- **AA**：不抓取、不嵌入。`data/crosswalk/aa.yml` 覆盖全部 43 个模型：33 个通过公开搜索索引核对到精确模型页（verified），10 个没有精确页（null，UI 回退 AA 总榜）：Codestral 2508、Qwen3.8 Flash、Qwen3.8 Omni Flash、GLM 4.7 FlashX、Seed Evolving / Character / 2.1 Pro、Hy4 Preview、Fugu Max、Mercury 3。没有直接访问 AA 页面。
- **Provider 筛选**：Models 的 `providerNames` 只列第一方 / 云平台；`gatewayOnly` 用于「仅网关」筛选。
- **测试**：`npm run test:e2e` 使用 Playwright + 本机 Chrome，覆盖筛选 / 排序 / URL、对比上限、报价折叠、缺失分数、榜单、移动端、AA 链接。

## 下一步（未做）

1. 本地 Next.js 静态壳 + 探索表，消费 `data/latest`。
2. 详情 / 对比 / 榜单 / `/about`。
3. 再决定是否上 Cloudflare；当前不部署。
