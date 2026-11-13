import type { Metadata } from 'next'
import { Card } from '@astryxdesign/core/Card'
import { Collapsible } from '@astryxdesign/core/Collapsible'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Link } from '@astryxdesign/core/Link'
import { List, ListItem } from '@astryxdesign/core/List'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Stack } from '@astryxdesign/core/Stack'
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { JsonLd } from '@/components/json-ld'
import { FRESHNESS_POLICY } from '@/lib/freshness'
import { arenaDate, catalog, manifest, modelsDevDate } from '@/lib/data'
import {
  ATTRIBUTION_URL,
  ISSUES_URL,
  LEGAL_REVIEW_URL,
  NEW_ISSUE_URL,
  REPO_URL,
  SITE_NAME,
  pageMetadata,
} from '@/lib/site'
import { breadcrumbLd, webPageLd } from '@/lib/structured-data'

const title = '数据说明与许可'
const description = 'Model Hub 的数据来源、许可、修改说明、价格与汇率免责、隐私、纠错和开源信息。'

export const metadata: Metadata = pageMetadata({
  title,
  description,
  path: '/about',
  alt: `${SITE_NAME} 数据说明与许可`,
})

const apiDate = modelsDevDate
const arenaTextDate = arenaDate('text')
const rows = catalog.rows
const withArena = rows.filter(m => m.text || m.webdev).length
const gatewayOnly = rows.filter(m => m.gatewayOnly).length
const crosswalk = manifest.crosswalk ?? { verified: 0, tentative: 0, none: 0 }
const aaLinks = manifest.aaLinks ?? { verified: 0, unverified: 0 }
const overrides = manifest.overrides
const fx = manifest.fx

const TOC = [
  { id: 'sources', label: '数据来源' },
  { id: 'coverage', label: '覆盖范围' },
  { id: 'freshness', label: '数据新鲜度' },
  { id: 'arena', label: 'Arena 修改说明' },
  { id: 'pricing', label: '价格、汇率与免责' },
  { id: 'overrides', label: '人工修正' },
  { id: 'trademark', label: '非官方与商标' },
  { id: 'privacy', label: '隐私' },
  { id: 'corrections', label: '纠错与下架' },
  { id: 'license', label: '开源与许可' },
  { id: 'legal', label: '法务复核' },
]

interface FreshnessRow extends Record<string, unknown> {
  source: string
  snapshot: string
  threshold: string
  after: string
}

const freshnessRows: FreshnessRow[] = [
  {
    source: 'models.dev',
    snapshot: apiDate,
    threshold: `${FRESHNESS_POLICY.modelsDev.thresholdHours} 小时`,
    after: '顶部提示，仍显示最近校验快照',
  },
  {
    source: 'Arena text / webdev',
    snapshot: arenaTextDate,
    threshold: `${FRESHNESS_POLICY.arena.thresholdHours} 小时`,
    after: '顶部提示，保留 condition 与日期',
  },
  {
    source: 'ECB 汇率',
    snapshot: fx.as_of,
    threshold: `${FRESHNESS_POLICY.fx.thresholdDays} 天`,
    after: '隐藏 CNY，只保留 USD',
  },
]

const freshnessColumns: TableColumn<FreshnessRow>[] = [
  { key: 'source', header: '来源', width: proportional(1, { minWidth: 140 }) },
  { key: 'snapshot', header: '快照日期', width: proportional(0.8, { minWidth: 100 }) },
  { key: 'threshold', header: '过期阈值', width: proportional(0.8, { minWidth: 100 }) },
  { key: 'after', header: '过期后', width: proportional(1.4, { minWidth: 200 }) },
]

const tocList = (
  <Stack gap={1}>
    {TOC.map(item => (
      <Link key={item.id} href={`#${item.id}`} display="block">{item.label}</Link>
    ))}
  </Stack>
)

export default function AboutPage() {
  return (
    <Stack className="sheet-inner" gap={4}>
      <JsonLd data={webPageLd({ name: title, description, path: '/about', type: 'AboutPage' })} />
      <JsonLd
        data={breadcrumbLd([
          { name: '模型目录', path: '/' },
          { name: '数据说明', path: '/about' },
        ])}
      />

      <HStack className="page-head" justify="between" align="start" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <Heading level={1}>数据说明与许可</Heading>
          <Text type="large">
            Model Hub 是一个只读的模型信息市场，面向中文开发者做模型选型。本站不提供交易、账号、评论或模型托管；
            不是任何模型厂商的官方站点。
          </Text>
        </Stack>
        <Stack gap={0} hAlign="end">
          <Text type="supporting">数据 {apiDate}</Text>
          <Text type="supporting">MIT · CC BY 4.0</Text>
        </Stack>
      </HStack>

      <Collapsible trigger="本页目录" defaultIsOpen>
        {tocList}
      </Collapsible>

      <Stack gap={4}>
              <Stack as="section" gap={2}>
                <Heading level={2} id="sources">数据来源</Heading>
                <List listStyle="disc">
                  <ListItem
                    label={
                      <Text>
                        <Text weight="semibold">models.dev</Text>：模型、价格、上下文、推理选项、模态等字段，MIT
                        License，Copyright (c) 2025 models.dev。数据快照 {apiDate}。来源：
                        <Link href="https://models.dev" isExternalLink>models.dev</Link> ·{' '}
                        <Link href="https://github.com/anomalyco/models.dev" isExternalLink>代码仓库 / LICENSE</Link>。
                      </Text>
                    }
                  />
                  <ListItem
                    label={
                      <Text>
                        <Text weight="semibold">LMArena Leaderboard Dataset</Text>：Arena text / webdev
                        偏好评分，CC BY 4.0。数据快照 {arenaTextDate}。来源：
                        <Link href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" isExternalLink>
                          HuggingFace 数据集
                        </Link>{' '}
                        ·{' '}
                        <Link href="https://creativecommons.org/licenses/by/4.0/" isExternalLink>CC BY 4.0</Link>。
                      </Text>
                    }
                  />
                  <ListItem
                    label={
                      <Text>
                        <Text weight="semibold">Artificial Analysis</Text>
                        ：仅作为外部链接，不嵌入数据、不调用 API、不展示 AA 分数。
                        逐模型 AA 链接只对经公开搜索索引核验过的 URL 展示，其余回退到 AA 总榜。本站与 AA
                        无合作、认证或背书关系。
                      </Text>
                    }
                  />
                  <ListItem
                    label={
                      <Text>
                        <Text weight="semibold">汇率</Text>
                        ：USD→CNY 展示折算使用欧洲央行（ECB）参考汇率，经 Frankfurter 获取。
                      </Text>
                    }
                  />
                </List>
                <Text as="p">
                  完整署名、许可边界和修改说明见{' '}
                  <Link href={ATTRIBUTION_URL} isExternalLink>ATTRIBUTION.md</Link>。
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="coverage">当前覆盖</Heading>
                <Text as="p">
                  当前目录 {rows.length} 个模型版本，其中 {withArena} 个有至少一条 Arena 分数，
                  {rows.length - withArena} 个未收录；{gatewayOnly} 个模型只有网关报价。
                  Arena 名称映射：verified {crosswalk.verified} / tentative {crosswalk.tentative} / none {crosswalk.none}。
                  AA 逐模型链接：verified {aaLinks.verified} / 其余 {aaLinks.unverified} 回退总榜。
                  未收录不等于能力差，页面会明确标注。
                  {crosswalk.tentative > 0
                    ? `有 ${crosswalk.tentative} 个 tentative 映射，上线前需复核。`
                    : '当前人工映射均为 verified，但仍需随数据更新复核。'}
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="freshness">数据新鲜度</Heading>
                <Text as="p">
                  models.dev 超过 {FRESHNESS_POLICY.modelsDev.thresholdHours} 小时、Arena 超过{' '}
                  {FRESHNESS_POLICY.arena.thresholdHours} 小时时，页面顶部提示数据可能过期，但仍显示最近一次通过校验的数据。
                  汇率超过 {FRESHNESS_POLICY.fx.thresholdDays} 天时隐藏 CNY，只保留 USD。数据不会因过期被隐藏。
                </Text>
                <Table
                  data={freshnessRows}
                  columns={freshnessColumns}
                  density="compact"
                  dividers="rows"
                  aria-label="数据来源、快照日期与过期处理"
                />
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="arena">Arena 修改说明</Heading>
                <Text as="p">
                  我们对原始数据做了展示所需的筛选与映射：text 只取 <Text type="code">category=overall</Text>，webdev
                  只取 <Text type="code">category=webdev</Text>；同一 model / organization 取最新{' '}
                  <Text type="code">leaderboard_publish_date</Text>，同日取最高{' '}
                  <Text type="code">vote_count</Text>；将 Arena 名称人工映射到 Model Version；未匹配行保留在榜单但不链模型页；
                  价格以 USD 存储，CNY 仅在展示层折算。未改变 rating 的含义，也不跨榜合并。
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="pricing">价格、汇率与免责</Heading>
                <Text as="p">
                  价格为 models.dev 快照中的 USD / 1M tokens，实际结算以供应商官网为准。CNY 仅为便利信息，使用
                  ECB 参考汇率折算：当前 1 USD ≈ {fx.usd_to_cny} CNY，汇率日期 {fx.as_of}，来源{' '}
                  <Link href={fx.source_url ?? 'https://frankfurter.dev'} isExternalLink>{fx.source}</Link>
                  。汇率不是交易价格，本页不构成交易或投资建议。
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="overrides">人工修正</Heading>
                <Text as="p">
                  源数据默认权威；人工修正记录在 <Text type="code">data/overrides/overrides.yml</Text>
                  ，每条包含作者、原因、时间和来源链接，并在 manifest 中留下审计记录。当前 override {overrides.count} 条，成功应用{' '}
                  {overrides.applied.length} 条。冲突和无效字段会进入校验报告；硬失败不会替换最近可用快照。
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="trademark">非官方与商标</Heading>
                <Text as="p">
                  本站不是任何模型厂商的官方站点，也不代表任何厂商的认证或背书。模型、供应商名称仅用于指称对应产品；
                  所有商标归各自所有者。本站不使用第三方 logo 或图片。
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="privacy">隐私</Heading>
                <Text as="p">
                  本站不提供账号、评论、收藏或分析；不使用 cookie，不加载分析脚本，不主动收集个人数据。
                  筛选、排序和对比状态只写入当前 URL，便于分享和刷新，不会发送到本站服务器。
                  通过 GitHub Issues 提交纠错时，内容会公开显示并受 GitHub 隐私政策约束。
                  公开部署后，静态托管商可能记录访问日志（IP、User-Agent 等）用于安全与运维，具体以托管商政策为准。
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="corrections">纠错与下架</Heading>
                <Text as="p">
                  数据纠错、字段修正或权利方下架请求，请通过{' '}
                  <Link href={NEW_ISSUE_URL} isExternalLink>GitHub Issues</Link>{' '}
                  提交，并附页面 URL、字段、当前值、建议值和可核验来源。我们会先核实，必要时先隐藏争议条目，再更新数据。
                  普通请求公开处理；敏感材料请先只提交一般性说明，维护者会再安排私下沟通方式。
                  仓库地址：<Link href={REPO_URL} isExternalLink>{REPO_URL}</Link>。
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="license">开源与许可</Heading>
                <Text as="p">
                  本项目代码以 MIT License 开源，见{' '}
                  <Link href={`${REPO_URL}/blob/main/LICENSE`} isExternalLink>LICENSE</Link>
                  。第三方数据仍受各自上游许可约束；MIT 不覆盖第三方模型数据、商标或 Artificial Analysis 内容。
                  models.dev 以 MIT License 提供；Arena 以 CC BY 4.0 提供，引用时保留 LMArena 署名、许可链接和上述修改说明。
                </Text>
                <Text as="p">
                  界面字体 IBM Plex Sans / IBM Plex Mono（Copyright 2019 IBM Corp.，
                  <Link href="https://scripts.sil.org/OFL" isExternalLink>SIL Open Font License 1.1</Link>
                  ）通过 @fontsource 自托管分发；字体不包含中文字形，中文回退到系统字体。
                </Text>
              </Stack>

              <Stack as="section" gap={2}>
                <Heading level={2} id="legal">法务复核</Heading>
                <Text as="p">
                  上线前仍需人工复核 models.dev 数据贡献许可、Arena CC BY 署名、AA 外链条款和托管商日志政策。
                  复核清单见 <Link href={LEGAL_REVIEW_URL} isExternalLink>docs/legal-review.md</Link>
                  。本页不是法律意见。当前未做外网部署。
                </Text>
              </Stack>

              <HStack gap={3} wrap="wrap">
                <Link href="/">返回模型目录</Link>
                <Link href={ISSUES_URL} isExternalLink>反馈与纠错</Link>
                <Link href={ATTRIBUTION_URL} isExternalLink>完整署名</Link>
              </HStack>

      </Stack>

      <Grid columns={{ minWidth: 260, max: 3 }} gap={3}>
        <Card padding={3}>
          <Stack gap={2}>
            <Heading level={2}>覆盖快照</Heading>
            <MetadataList label={{ position: 'start' }}>
              <MetadataListItem label="模型版本">{rows.length}</MetadataListItem>
              <MetadataListItem label="有 Arena 评分">{withArena}</MetadataListItem>
              <MetadataListItem label="未收录">{rows.length - withArena}</MetadataListItem>
              <MetadataListItem label="仅网关报价">{gatewayOnly}</MetadataListItem>
            </MetadataList>
          </Stack>
        </Card>
        <Card padding={3}>
          <Stack gap={2}>
            <Heading level={2}>数据日期</Heading>
            <MetadataList label={{ position: 'start' }}>
              <MetadataListItem label="models.dev">{apiDate}</MetadataListItem>
              <MetadataListItem label="Arena">{arenaTextDate}</MetadataListItem>
              <MetadataListItem label="汇率">{fx.as_of}</MetadataListItem>
            </MetadataList>
            <Text type="supporting">过期只提示，不隐藏数据；汇率过期则隐藏 CNY。</Text>
          </Stack>
        </Card>
        <Card padding={3}>
          <Stack gap={2}>
            <Heading level={2}>纠错与下架</Heading>
            <Text type="supporting">
              附上页面 URL、字段、当前值、建议值和可核验来源；敏感材料先提交一般性说明。
            </Text>
            <Link href={NEW_ISSUE_URL} isExternalLink>提交 GitHub Issue</Link>
          </Stack>
        </Card>
      </Grid>
    </Stack>
  )
}
