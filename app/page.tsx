import type { Metadata } from 'next'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { ExploreClient } from '@/components/explore-client'
import { JsonLd } from '@/components/json-ld'
import { catalog, modelsDevDate } from '@/lib/data'
import { ciOverlaps, fmtRange } from '@/lib/format'
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
          name: `${SITE_NAME} 模型目录`,
          items: catalog.index.map(model => ({ name: model.name, path: modelHref(model.canonicalId) })),
        })}
      />
      <Stack className="sheet-inner" gap={4}>
        <HStack className="page-head" justify="between" align="start" wrap="wrap" gap={3}>
          <Stack gap={1}>
            <Heading level={1}>选型工作台</Heading>
            <Text type="large">{finding}</Text>
          </Stack>
          <Stack gap={0} hAlign="end">
            <Text type="supporting">数据 {modelsDevDate}</Text>
            <Text type="supporting">{rows.length} 个模型 · {labCount} 个实验室</Text>
          </Stack>
        </HStack>
        <ExploreClient models={rows} domains={catalog.domains} dataDate={modelsDevDate} />
      </Stack>
    </>
  )
}
