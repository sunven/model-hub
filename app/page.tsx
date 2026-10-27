import type { Metadata } from 'next'
import { ExploreClient } from '@/components/explore-client'
import { JsonLd } from '@/components/json-ld'
import { catalog, modelsDevDate } from '@/lib/data'
import { ciOverlaps, fmtRange } from '@/lib/format'
import { OG_IMAGE, modelHref } from '@/lib/site'
import { itemListLd, webPageLd } from '@/lib/structured-data'

const title = '选型工作台'
const description = '比较模型版本的价格、上下文、推理等级和 Arena 评分。'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${title} | Model Hub`,
    description,
    url: '/',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Model Hub 模型信息市场' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | Model Hub`, description, images: [OG_IMAGE] },
}

const rows = catalog.rows
const withArena = rows.filter(row => row.text || row.webdev)
const priced = rows.filter(row => row.price)
const outputMin = Math.min(...priced.map(row => row.price!.outputMin))
const outputMax = Math.max(...priced.map(row => row.price!.outputMax))
const labCount = new Set(rows.map(row => row.lab)).size
const [topText, nextText] = catalog.topText(2)
const topOverlap = Boolean(topText && nextText && ciOverlaps(topText.text!, nextText.text!))

const finding = `${rows.length} 个模型版本，输出价 ${fmtRange(outputMin, outputMax)} / 1M；${withArena.length} 个有 Arena 评分，${
  topOverlap ? '榜首两名的置信区间重叠。' : '榜首与次席的置信区间不重叠。'
}`

export default function HomePage() {
  return (
    <>
      <JsonLd data={webPageLd({ name: title, description, path: '/', type: 'CollectionPage' })} />
      <JsonLd
        data={itemListLd({
          name: 'Model Hub 模型目录',
          items: catalog.index.map(model => ({ name: model.name, path: modelHref(model.canonicalId) })),
        })}
      />
      <div className="sheet-inner">
        <section className="page-head">
          <div>
            <h1>选型工作台</h1>
            <p className="lede">{finding}</p>
          </div>
          <p className="meta">
            数据 {modelsDevDate}
            <br />
            {rows.length} 个模型 · {labCount} 个实验室
          </p>
        </section>
        <ExploreClient models={rows} domains={catalog.domains} dataDate={modelsDevDate} />
      </div>
    </>
  )
}
