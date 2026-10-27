import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container">
      <div className="empty" style={{ marginTop: 40 }}>
        <strong>没有找到这个页面</strong>
        <p>模型可能不在首批 43 个目录里，或者链接已经失效。</p>
        <Link className="btn primary" href="/" style={{ marginTop: 12 }}>返回模型表</Link>
      </div>
    </div>
  )
}
