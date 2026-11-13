import { Divider } from '@astryxdesign/core/Divider'
import { Grid } from '@astryxdesign/core/Grid'
import { HStack } from '@astryxdesign/core/HStack'
import { Link } from '@astryxdesign/core/Link'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { brandMark } from './brand-mark'
import { manifest, modelsDevDate } from '@/lib/data'
import { ATTRIBUTION_URL, NEW_ISSUE_URL, REPO_URL, SITE_NAME } from '@/lib/site'

export function SiteFooter() {
  return (
    <Stack as="footer" className="site-footer" gap={0}>
      <Stack className="footer-inner" gap={4} paddingBlock={4}>
        <HStack justify="between" align="start" wrap="wrap" gap={5}>
        <Stack gap={2} maxWidth={360}>
          <Link href="/" isStandalone>
            <HStack gap={1} vAlign="center">
              {brandMark}
              <Text weight="semibold">{SITE_NAME}</Text>
            </HStack>
          </Link>
          <Text type="supporting">
            面向中文开发者的只读模型信息市场。比较价格、上下文、推理等级与 Arena 偏好评分。
          </Text>
        </Stack>
        <Grid columns={{ minWidth: 160, max: 3 }} gap={4}>
          <Stack gap={1}>
            <Text type="label" weight="semibold">数据</Text>
            <Link href="https://models.dev" isExternalLink display="block">models.dev（MIT）</Link>
            <Link
              href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset"
              isExternalLink
              display="block"
            >
              LMArena Dataset（CC BY 4.0）
            </Link>
            <Link href="https://artificialanalysis.ai" isExternalLink display="block">
              Artificial Analysis（外链）
            </Link>
          </Stack>
          <Stack gap={1}>
            <Text type="label" weight="semibold">项目</Text>
            <Link href={REPO_URL} isExternalLink display="block">GitHub</Link>
            <Link href={NEW_ISSUE_URL} isExternalLink display="block">纠错 / 下架</Link>
            <Link href={ATTRIBUTION_URL} isExternalLink display="block">署名与许可</Link>
          </Stack>
          <Stack gap={1}>
            <Text type="label" weight="semibold">说明</Text>
            <Link href="/about" display="block">数据说明与许可</Link>
            <Link href="/about#freshness" display="block">数据新鲜度</Link>
            <Text type="supporting">汇率 ECB / Frankfurter · {manifest.fx.as_of}</Text>
          </Stack>
        </Grid>
      </HStack>
      <Divider />
      <HStack justify="between" wrap="wrap" gap={2}>
        <Text type="supporting">非官方，模型与商标归各自所有者。价格以供应商官网为准。</Text>
        <Text type="supporting">本地预览 · 未做外网部署 · 数据 {modelsDevDate}</Text>
      </HStack>
      </Stack>
    </Stack>
  )
}
