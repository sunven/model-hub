import type { Metadata } from 'next'
import { Stack } from '@astryxdesign/core/Stack'
import { ExploreClient } from '@/components/explore-client'
import { JsonLd } from '@/components/json-ld'
import { catalog, modelsDevDate } from '@/lib/data'
import { SITE_NAME, modelHref, pageMetadata } from '@/lib/site'
import { itemListLd, webPageLd } from '@/lib/structured-data'

const title = '选型工作台'
const description = '比较模型版本的价格、上下文、推理等级和 Arena 评分。'

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: '/',
  alt: `${SITE_NAME} 模型信息市场`,
})

const rows = catalog.rows

export default function HomePage() {
  return (
    <>
      <JsonLd data={webPageLd({ name: title, description, path: '/', type: 'CollectionPage' })} />
      <JsonLd
        data={itemListLd({
          name: `${SITE_NAME} 模型目录`,
          items: catalog.index.map(model => ({ name: model.name, path: modelHref(model.canonicalId) })),
        })}
      />
      <Stack className="sheet-inner" gap={6}>
        <ExploreClient models={rows} domains={catalog.domains} dataDate={modelsDevDate} />
      </Stack>
    </>
  )
}
