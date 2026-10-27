# Model Hub

面向中文开发者的只读模型信息市场。比较模型版本的价格、上下文、推理等级和 Arena 偏好评分，并链接到 Artificial Analysis 的模型页。

[![CI](https://github.com/sunven/model-hub/actions/workflows/ci.yml/badge.svg)](https://github.com/sunven/model-hub/actions/workflows/ci.yml)

> 当前状态：本地优先的 MVP，未做外网部署。构建产物是纯静态站点，数据和页面均可离线检查。

## 功能

- 43 个首批模型版本、20 个实验室；模型、报价、上下文、推理选项来自 models.dev。
- Arena text / webdev 两条榜单，保留条件、置信区间、票数、日期和未匹配行。
- 模型详情报价按第一方、云平台、网关分组，默认折叠网关与已弃用报价。
- 最多 3 个模型并排对比，支持筛选、排序、搜索和 URL 状态。
- Artificial Analysis 仅作为外链，不嵌入分数、不调用 API；未核验链接回退 AA 总榜。
- 快照哈希、校验报告、last-good 保留、人工 override、JSON Schema 和来源日期。

## 本地运行

要求 Node.js 22+、npm 和 curl。

```bash
npm ci
npm run dev
```

打开 http://localhost:3000。仓库已包含通过校验的 `data/latest`，首次运行不需要联网。

```bash
npm run typecheck   # TypeScript
npm run test:unit   # 纯逻辑与数据契约
npm run schema:check # 检查 JSON Schema 是否与契约一致
npm run test:e2e    # Playwright（本地默认使用 Chrome）
npm run build       # 静态导出到 out/
```

Compare Set 由 `CompareProvider` 唯一持有，页面、托盘和导航栏共用；合法 ID、去重、顺序和最多 3 个的规则统一在 `lib/compare-set.ts`。localStorage 只用于首次恢复与保存选择。对比 URL 中显式给出的 `models` 优先，包括空值和全部无效的 ID；裸 `/compare` 首次进入可恢复已有选择，浏览器返回到已清空的对比地址会恢复空集合。移除和清空用 `replaceState` 更新当前地址，保留其他 query、hash 与 history state。

## 数据刷新

```bash
npm run data:refresh   # 下载 models.dev + Arena 数据，更新 ECB 汇率，重建快照
npm run data:offline   # 使用 data/raw 缓存重建，不联网
npm run data           # 缓存存在时复用，否则下载
npm run data:offline -- --data-dir /absolute/path/to/data # 使用独立数据目录
```

管道先校验并写入临时目录，再通过目录 rename 发布 `data/latest` 与 `data/schema`。写入或替换失败会回滚两份目录，报告写到 `data/validation-report.json`；若文件系统连回滚也拒绝，报告会注明保留下来的备份目录。跨目录发布不保证进程崩溃时的原子性，同一数据目录应只运行一个写入者。`data/raw` 不纳入版本控制。

CLI 默认数据目录相对于仓库定位，不受启动目录影响。独立数据目录需包含 `launch-set.yml`、`crosswalk/`、`fx.yml`；离线运行还需 `raw/` 缓存。

程序调用使用 `scripts/snapshot.ts` 的 `runSnapshot({ source, now, dataDir })`，导入时不执行任务，不写日志或修改进程退出码。`source.load(now)` 提供原始目录、Arena 行、配置和来源记录；`createSnapshotSource`（`scripts/fetch.ts`）提供真实下载/缓存 adapter，测试可直接提供 fixture adapter。结果包含 `status`、`report` 和成功时的 `manifest`；无法保存失败报告时会抛错。

Snapshot ID 同时哈希构建代码、依赖锁文件及数据输入。固定输入、代码与时钟可复现所有输出字节。抓取时间保存在缓存旁的 `.metadata.json`，仅在哈希匹配时复用；旧缓存可从哈希匹配的上一份 Manifest 恢复时间，否则标为时间未知（以 1970-01-01 表示并提示 Stale），不会把缓存文件的修改时间当成抓取时间。

数据新鲜度策略统一定义在 `lib/freshness.ts`，供管道、校验和界面使用，当前阈值见站内「数据说明」。按实际经过的毫秒判断：恰好达到阈值仍有效，超过才标为 Stale；Manifest 中取整的年龄仅供展示。Arena 取 text/webdev 中最旧的抓取时间；未来时间的年龄按 0 处理，无效时间视为 Stale，并阻止管道发布。仅含日期的汇率生效时间按 UTC 零点计算。

浏览器共用一个时钟，在越过阈值或回到页面时更新提示及 CNY。静态 HTML 保留 USD，CNY 在浏览器确认汇率有效后显示，避免较早构建的页面继续显示过期换算。模型与 Arena 数据不会因过期被隐藏。

## 配置

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| `SITE_URL` | `https://model-hub.example` | canonical、sitemap、robots、Open Graph 的站点源。部署前必须替换。 |

复制 `.env.example` 为 `.env.local` 可覆盖本地构建配置。

## 数据契约

`lib/snapshot.ts` 是 Snapshot 契约的权威：定义 Zod schema、由 schema 推导的 TypeScript 类型和快照校验规则。数据管道与站点构建共用这份契约，`scripts/types.ts` 仅保留上游输入与管道处理结果的类型。

修改契约后运行 `npm run schema:generate`，并提交生成的 `data/schema/*.json`。CI 通过 `npm run schema:check` 拦截遗漏更新、缺失或多余的 schema；这两条命令均不刷新数据快照。

```text
data/latest/models.json               ModelVersion
data/latest/offers.json               Offer
data/latest/scores.json               Arena Score（text / webdev）
data/latest/unmatched.json            未映射的 Arena 行
data/latest/manifest.json             快照、来源、哈希、计数、新鲜度
data/latest/validation-report.json    校验结果
data/schema/*.json                    输出 JSON Schema
data/crosswalk/*.yml                  人工 crosswalk
data/overrides/*.yml                  人工修正与审计
data/fx.yml                           USD→CNY 汇率与来源
```

设计记录在 [`.scratch/model-hub/spec.md`](.scratch/model-hub/spec.md)，领域词汇见 [`GLOSSARY.md`](GLOSSARY.md)。

## 来源、许可与免责

- [models.dev](https://models.dev)：模型与价格数据，MIT License，Copyright (c) 2025 models.dev。
- [LMArena Leaderboard Dataset](https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset)：Arena 评分，CC BY 4.0；本站按 category 和日期筛选、映射到模型版本并改变展示格式。
- [Artificial Analysis](https://artificialanalysis.ai)：只提供经人工核验的外部链接，不嵌入数据、不调用 API、不展示分数。
- 汇率来自欧洲央行（ECB）参考汇率，经 [Frankfurter](https://frankfurter.dev) 获取；仅用于展示，不构成交易或投资建议。

完整署名、修改说明和数据许可边界见 [`ATTRIBUTION.md`](ATTRIBUTION.md)。本项目代码使用 MIT License，见 [`LICENSE`](LICENSE)。模型与供应商名称仅作指称，商标归各自所有者；本站非官方，也不代表任何厂商的背书。

## 纠错与下架

数据纠错、字段修正和权利方下架请求统一走 [GitHub Issues](https://github.com/sunven/model-hub/issues/new/choose)。请提供页面 URL、字段、当前值、建议值和可核验来源。敏感请求可先只提交一般性说明，维护者会再安排私下沟通方式。

## 部署

按当前项目决定，暂不做外网部署。未来部署说明见 [`docs/deployment.md`](docs/deployment.md)；公开前还需完成 [`docs/legal-review.md`](docs/legal-review.md) 中的人工复核项。
