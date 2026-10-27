import type { Metadata } from 'next'
import Link from 'next/link'
import { manifest, modelRows } from '@/lib/data'

export const metadata: Metadata = {
  title: '数据说明与许可',
  description: 'Model Hub 的数据来源、许可、修改说明、价格免责、隐私与纠错方式。',
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

export default function AboutPage() {
  return (
    <div className="about-wrap">
      <div className="kicker">ABOUT · DATA · LICENSES</div>
      <h1>数据说明与许可</h1>
      <p>
        Model Hub 是一个只读的模型信息市场，面向中文开发者做模型选型。本站不提供交易、账号、评论或模型托管。
      </p>

      <div className="about-card">
        <h2 style={{ marginTop: 0 }}>数据来源</h2>
        <ul>
          <li>
            <strong>models.dev</strong>：模型、价格、上下文、推理选项、模态等字段，MIT License。数据快照 {apiDate}。
            来源：<a href="https://models.dev" target="_blank" rel="noopener noreferrer">models.dev</a> ·
            <a href="https://github.com/anomalyco/models.dev" target="_blank" rel="noopener noreferrer">代码仓库 / LICENSE</a>。
          </li>
          <li>
            <strong>LMArena Leaderboard Dataset</strong>：Arena text / webdev 偏好评分，CC BY 4.0。数据快照 {arenaDate}。
            来源：
            <a href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noopener noreferrer">
              HuggingFace 数据集
            </a>
            ·
            <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>。
          </li>
          <li>
            <strong>Artificial Analysis</strong>：仅作为外部链接，不嵌入数据、不调用 API、不展示 AA 分数。
            逐模型 AA 链接只对人工验证过的 URL 展示，其余回退到 AA 总榜。
            来源：<a href="https://artificialanalysis.ai/leaderboards/models" target="_blank" rel="noopener noreferrer">AA 榜单</a>。
          </li>
        </ul>
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

      <h2>Arena 修改说明</h2>
      <p>
        我们对原始数据做了展示所需的筛选与映射：text 只取 <code>category=overall</code>，webdev 只取{' '}
        <code>category=webdev</code>；同一 model / organization 取最新 <code>leaderboard_publish_date</code>，
        同日取最高 <code>vote_count</code>；将 Arena 名称人工映射到 Model Version；未匹配行保留在榜单但不链模型页；
        价格以 USD 存储，CNY 仅在展示层折算。未改变 rating 的含义。
      </p>

      <h2>价格、汇率与免责</h2>
      <p>
        价格为 models.dev 快照中的 USD / 1M tokens，实际结算以供应商官网为准。CNY 仅为便利信息，使用本地
        <code>data/fx.yml</code> 人工汇率折算；当前汇率来源标注为「manual placeholder」，上线前必须复核。
        汇率超过 14 天时，界面应隐藏 CNY，只保留 USD。本页不构成交易或投资建议。
      </p>

      <h2>非官方与商标</h2>
      <p>
        本站不是任何模型厂商的官方站点，也不代表任何厂商的认证或背书。模型、供应商名称仅用于指称对应产品；
        所有商标归各自所有者。本站不使用第三方 logo。
      </p>

      <h2>隐私</h2>
      <p>
        本站不提供账号、评论、收藏或分析；不使用 cookie，不收集个人数据。静态托管商可能记录访问日志（IP、User-Agent 等），
        用于安全与运维，具体见托管商隐私政策。若未来加入分析或账号，会重新评估并按需要提供 consent。
      </p>

      <h2>纠错与下架</h2>
      <p>
        数据纠错、字段修正或权利方下架请求，计划通过公开 GitHub Issues 处理；仓库 URL 在上线前补齐。
        在此之前，本地预览阶段请直接联系维护者。我们会在核实后隐藏或修正对应数据，并保留内部记录。
      </p>

      <h2>许可文本</h2>
      <p>
        models.dev 以 MIT License 提供。使用时保留其版权与许可声明；完整文本见上游仓库 LICENSE。
        Arena Leaderboard Dataset 以 CC BY 4.0 提供；引用时保留 LMArena 署名、许可链接和上述修改说明。
      </p>

      <p style={{ marginTop: 24 }}>
        <Link href="/">← 返回模型表</Link>
      </p>
    </div>
  )
}
