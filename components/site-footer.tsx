import Link from 'next/link'
import { manifest } from '@/lib/data'
import { ATTRIBUTION_URL, NEW_ISSUE_URL, REPO_URL } from '@/lib/site'

const dataDate = manifest.sources?.modelsDev?.files?.api?.fetchedAt
  ? new Date(manifest.sources.modelsDev.files.api.fetchedAt).toISOString().slice(0, 10)
  : '2026-10-26'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Link className="brand" href="/" aria-label="Model Hub 首页">
              <svg className="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 5.2v5.2M12 13.6v5.2M5.2 12h5.2M13.6 12h5.2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="2.4" fill="currentColor" />
                <circle cx="12" cy="3.4" r="1.6" fill="currentColor" />
                <circle cx="12" cy="20.6" r="1.6" fill="currentColor" />
                <circle cx="3.4" cy="12" r="1.6" fill="currentColor" />
                <circle cx="20.6" cy="12" r="1.6" fill="currentColor" />
              </svg>
              <span>Model Hub</span>
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
          <span>本地预览 · 未做外网部署 · 数据 {dataDate}</span>
        </div>
      </div>
    </footer>
  )
}
