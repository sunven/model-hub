import type { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/json-ld'
import { manifest, modelRows } from '@/lib/data'
import {
  ATTRIBUTION_URL,
  ISSUES_URL,
  LEGAL_REVIEW_URL,
  NEW_ISSUE_URL,
  OG_IMAGE,
  REPO_URL,
} from '@/lib/site'
import { breadcrumbLd, webPageLd } from '@/lib/structured-data'

const title = '数据说明与许可'
const description = 'Model Hub 的数据来源、许可、修改说明、价格与汇率免责、隐私、纠错和开源信息。'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/about' },
  openGraph: {
    title: `${title} | Model Hub`,
    description,
    url: '/about',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Model Hub 数据说明与许可' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | Model Hub`, description, images: [OG_IMAGE] },
}

const apiDate = manifest.sources?.modelsDev?.files?.api?.fetchedAt
  ? new Date(manifest.sources.modelsDev.files.api.fetchedAt).toISOString().slice(0, 10)
  : '2026-10-26'
const arenaDate = manifest.sources?.arena?.files?.text?.fetchedAt
  ? new Date(manifest.sources.arena.files.text.fetchedAt).toISOString().slice(0, 10)
  : '2026-10-27'
const withArena = modelRows.filter(m => m.text || m.webdev).length
const gatewayOnly = modelRows.filter(m => m.gatewayOnly).length
const crosswalk = manifest.crosswalk ?? { verified: 0, tentative: 0, none: 0 }
const aaLinks = manifest.aaLinks ?? { verified: 0, unverified: 0 }
const overrides = manifest.overrides
const fx = manifest.fx

export default function AboutPage() {
  return (
    <div className="about-wrap">
      <JsonLd data={webPageLd({ name: title, description, path: '/about', type: 'AboutPage' })} />
      <JsonLd
        data={breadcrumbLd([
          { name: '模型目录', path: '/' },
          { name: '数据说明', path: '/about' },
        ])}
      />
      <div className="kicker">ABOUT · DATA · LICENSES</div>
      <h1>数据说明与许可</h1>
      <p>
        Model Hub 是一个只读的模型信息市场，面向中文开发者做模型选型。本站不提供交易、账号、评论或模型托管；
        不是任何模型厂商的官方站点。
      </p>

      <div className="about-card">
        <h2 style={{ marginTop: 0 }}>数据来源</h2>
        <ul>
          <li>
            <strong>models.dev</strong>：模型、价格、上下文、推理选项、模态等字段，MIT License，Copyright (c) 2025
            models.dev。数据快照 {apiDate}。来源：
            <a href="https://models.dev" target="_blank" rel="noopener noreferrer">models.dev</a> ·
            <a href="https://github.com/anomalyco/models.dev" target="_blank" rel="noopener noreferrer">
              代码仓库 / LICENSE
            </a>。
          </li>
          <li>
            <strong>LMArena Leaderboard Dataset</strong>：Arena text / webdev 偏好评分，CC BY 4.0。数据快照 {arenaDate}。来源：
            <a href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noopener noreferrer">
              HuggingFace 数据集
            </a>
            ·
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">
              CC BY 4.0
            </a>。
          </li>
          <li>
            <strong>Artificial Analysis</strong>：仅作为外部链接，不嵌入数据、不调用 API、不展示 AA 分数。
            逐模型 AA 链接只对经公开搜索索引核验过的 URL 展示，其余回退到 AA 总榜。本站与 AA 无合作、认证或背书关系。
          </li>
          <li>
            <strong>汇率</strong>：USD→CNY 展示折算使用欧洲央行（ECB）参考汇率，经 Frankfurter 获取。
          </li>
        </ul>
        <p style={{ marginBottom: 0 }}>
          完整署名、许可边界和修改说明见{' '}
          <a href={ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">
            ATTRIBUTION.md
          </a>
          。
        </p>
      </div>

      <h2>当前覆盖</h2>
      <p>
        当前目录 {modelRows.length} 个模型，其中 {withArena} 个有至少一条 Arena 分数，
        {modelRows.length - withArena} 个未收录；{gatewayOnly} 个模型只有网关报价。
        Arena 名称映射：verified {crosswalk.verified} / tentative {crosswalk.tentative} / none {crosswalk.none}。
        AA 逐模型链接：verified {aaLinks.verified} / 其余 {aaLinks.unverified} 回退总榜。
        未收录不等于能力差，页面会明确标注。
        {crosswalk.tentative > 0
          ? `有 ${crosswalk.tentative} 个 tentative 映射，上线前需复核。`
          : '当前人工映射均为 verified，但仍需随数据更新复核。'}
      </p>

      <h2 id="freshness">数据新鲜度</h2>
      <p>
        models.dev 快照获取于 {apiDate}，Arena text / webdev 获取于 {arenaDate}。
        models.dev 超过 48 小时、Arena 超过 72 小时时，页面顶部提示数据可能过期，但仍显示最近一次通过校验的数据。
        汇率超过 14 天时隐藏 CNY，只保留 USD。
      </p>

      <h2>Arena 修改说明</h2>
      <p>
        我们对原始数据做了展示所需的筛选与映射：text 只取 <code>category=overall</code>，webdev 只取{' '}
        <code>category=webdev</code>；同一 model / organization 取最新 <code>leaderboard_publish_date</code>，
        同日取最高 <code>vote_count</code>；将 Arena 名称人工映射到 Model Version；未匹配行保留在榜单但不链模型页；
        价格以 USD 存储，CNY 仅在展示层折算。未改变 rating 的含义，也不跨榜合并。
      </p>

      <h2>价格、汇率与免责</h2>
      <p>
        价格为 models.dev 快照中的 USD / 1M tokens，实际结算以供应商官网为准。CNY 仅为便利信息，使用
        ECB 参考汇率折算：当前 1 USD ≈ {fx.usd_to_cny} CNY，汇率日期 {fx.as_of}，来源{' '}
        <a href={fx.source_url ?? 'https://frankfurter.dev'} target="_blank" rel="noopener noreferrer">
          {fx.source}
        </a>
        。汇率不是交易价格，本页不构成交易或投资建议。
      </p>

      <h2>人工修正</h2>
      <p>
        源数据默认权威；人工修正记录在 <code>data/overrides/overrides.yml</code>，每条包含作者、原因、时间和来源链接，
        并在 manifest 中留下审计记录。当前 override {overrides.count} 条，成功应用 {overrides.applied.length} 条。
        冲突和无效字段会进入校验报告；硬失败不会替换最近可用快照。
      </p>

      <h2>非官方与商标</h2>
      <p>
        本站不是任何模型厂商的官方站点，也不代表任何厂商的认证或背书。模型、供应商名称仅用于指称对应产品；
        所有商标归各自所有者。本站不使用第三方 logo 或图片。
      </p>

      <h2>隐私</h2>
      <p>
        本站不提供账号、评论、收藏或分析；不使用 cookie，不加载分析脚本，不主动收集个人数据。
        筛选、排序和对比状态只写入当前 URL，便于分享和刷新，不会发送到本站服务器。
        通过 GitHub Issues 提交纠错时，内容会公开显示并受 GitHub 隐私政策约束。
        公开部署后，静态托管商可能记录访问日志（IP、User-Agent 等）用于安全与运维，具体以托管商政策为准。
      </p>

      <h2>纠错与下架</h2>
      <p>
        数据纠错、字段修正或权利方下架请求，请通过{' '}
        <a href={NEW_ISSUE_URL} target="_blank" rel="noopener noreferrer">
          GitHub Issues
        </a>{' '}
        提交，并附页面 URL、字段、当前值、建议值和可核验来源。我们会先核实，必要时先隐藏争议条目，再更新数据。
        普通请求公开处理；敏感材料请先只提交一般性说明，维护者会再安排私下沟通方式。
        仓库地址：<a href={REPO_URL} target="_blank" rel="noopener noreferrer">{REPO_URL}</a>。
      </p>

      <h2>开源与许可</h2>
      <p>
        本项目代码以 MIT License 开源，见{' '}
        <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">
          LICENSE
        </a>
        。第三方数据仍受各自上游许可约束；MIT 不覆盖第三方模型数据、商标或 Artificial Analysis 内容。
        models.dev 以 MIT License 提供；Arena 以 CC BY 4.0 提供，引用时保留 LMArena 署名、许可链接和上述修改说明。
      </p>

      <h2>法务复核</h2>
      <p>
        上线前仍需人工复核 models.dev 数据贡献许可、Arena CC BY 署名、AA 外链条款和托管商日志政策。
        复核清单见{' '}
        <a href={LEGAL_REVIEW_URL} target="_blank" rel="noopener noreferrer">
          docs/legal-review.md
        </a>
        。本页不是法律意见。当前未做外网部署。
      </p>

      <p style={{ marginTop: 24 }}>
        <Link href="/">← 返回模型表</Link>
        {' · '}
        <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer">
          反馈与纠错
        </a>
      </p>
    </div>
  )
}
