import Link from 'next/link'
import { brandMark } from './brand-mark'
import { manifest, modelsDevDate } from '@/lib/data'
import { ATTRIBUTION_URL, NEW_ISSUE_URL, REPO_URL, SITE_NAME } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link className="brand" href="/" aria-label={`${SITE_NAME} 首页`}>
              {brandMark}
              <span>{SITE_NAME}</span>
            </Link>
            <p>面向中文开发者的只读模型信息市场。比较价格、上下文、推理等级与 Arena 偏好评分。</p>
          </div>
          <nav className="footer-cols" aria-label="页脚链接">
            <div>
              <h2>数据</h2>
              <a href="https://models.dev" target="_blank" rel="noopener noreferrer">models.dev（MIT）</a>
              <a
                href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset"
                target="_blank"
                rel="noopener noreferrer"
              >
                LMArena Dataset（CC BY 4.0）
              </a>
              <a href="https://artificialanalysis.ai" target="_blank" rel="noopener noreferrer">
                Artificial Analysis（外链）
              </a>
            </div>
            <div>
              <h2>项目</h2>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href={NEW_ISSUE_URL} target="_blank" rel="noopener noreferrer">纠错 / 下架</a>
              <a href={ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">署名与许可</a>
            </div>
            <div>
              <h2>说明</h2>
              <Link href="/about">数据说明与许可</Link>
              <Link href="/about#freshness">数据新鲜度</Link>
              <span>汇率 ECB / Frankfurter · {manifest.fx.as_of}</span>
            </div>
          </nav>
        </div>
        <div className="footer-legal">
          <span>非官方，模型与商标归各自所有者。价格以供应商官网为准。</span>
          <span>本地预览 · 未做外网部署 · 数据 {modelsDevDate}</span>
        </div>
      </div>
    </footer>
  )
}
