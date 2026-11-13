import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@astryxdesign/core/Badge'
import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Link as AstryxLink } from '@astryxdesign/core/Link'
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { StatusBadges } from '@/components/badges'
import { CnyPricePair } from '@/components/cny-price'
import { CiRail } from '@/components/ci-rail'
import { CompareButton } from '@/components/compare-tray'
import { JsonLd } from '@/components/json-ld'
import { OfferTable } from '@/components/offer-table'
import { AA_LEADERBOARD_URL, modelHref, pageMetadata } from '@/lib/site'
import { breadcrumbLd, webPageLd } from '@/lib/structured-data'
import {
  ciHalf,
  fmtContext,
  fmtDate,
  fmtRange,
  fmtVotes,
  scoreMeta,
} from '@/lib/format'
import { catalog, fx, modelsDevDate } from '@/lib/data'
import type { CiDomain, Score } from '@/lib/types'

type Props = { params: Promise<{ lab: string; model: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return catalog.index.map(model => {
    const [lab, ...rest] = model.canonicalId.split('/')
    return { lab, model: rest.join('/') }
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lab, model } = await params
  const found = catalog.getDetail(`${lab}/${model}`)?.model
  if (!found) return { title: '模型未找到', robots: { index: false, follow: false } }
  const title = `${found.name} — 价格、上下文、推理等级与 Arena 评分`
  const description = found.description ?? `${found.name} 的价格、上下文、推理等级和 Arena 评分。`
  const path = modelHref(found.canonicalModelId)
  return {
    ...pageMetadata({ title, description, path, alt: found.name, type: 'article' }),
    robots: { index: true, follow: true },
  }
}

function ScoreSpec({ label, score, domain }: { label: string; score: Score | null; domain: CiDomain | null }) {
  return (
    <Card padding={3}>
      <Stack gap={1}>
        <Text type="supporting">{label}</Text>
        {score ? (
          <>
            <HStack gap={2} vAlign="center">
              <CiRail stat={score} domain={domain} width={64} />
              <Text type="large" weight="semibold" hasTabularNumbers>{score.rating.toFixed(1)}</Text>
            </HStack>
            <Text type="supporting">{scoreMeta(score)} · {fmtVotes(score.votes)} 票</Text>
          </>
        ) : (
          <>
            <Text type="large" color="secondary">未收录</Text>
            <Text type="supporting">Arena 未收录，不代表能力差</Text>
          </>
        )}
      </Stack>
    </Card>
  )
}

function ArenaCard({
  board,
  label,
  primary,
  scores,
  domain,
}: {
  board: 'text' | 'webdev'
  label: string
  primary: Score | null
  scores: Score[]
  domain: CiDomain | null
}) {
  return (
    <Card padding={4}>
      <Stack gap={2}>
        <HStack justify="between" vAlign="center" gap={2}>
          <Text type="label" weight="semibold">{label}</Text>
          <Badge label={primary?.condition ?? '未收录'} variant="neutral" />
        </HStack>
        {primary ? (
          <>
            <HStack gap={3} vAlign="center">
              <CiRail stat={primary} domain={domain} width={96} />
              <Text size="3xl" weight="semibold" hasTabularNumbers>{primary.rating.toFixed(1)}</Text>
            </HStack>
            <HStack gap={3} wrap="wrap">
              <Text type="supporting">CI {primary.ciLow.toFixed(1)}–{primary.ciHigh.toFixed(1)}</Text>
              <Text type="supporting">#{primary.rank}</Text>
              <Text type="supporting">{fmtVotes(primary.votes)} 票</Text>
            </HStack>
            <Text type="supporting">
              {primary.condition} · {primary.snapshotDate} · Arena HF
            </Text>
            {scores.length > 1 && (
              <Stack gap={1}>
                {scores.map(score => (
                  <HStack key={score.id} justify="between" gap={2}>
                    <Text type="supporting">{score.condition}</Text>
                    <HStack gap={2}>
                      <Text hasTabularNumbers>{score.rating.toFixed(1)}</Text>
                      <Text type="supporting">#{score.rank} · ±{ciHalf(score).toFixed(1)}</Text>
                      <Text type="supporting">{fmtVotes(score.votes)} 票</Text>
                    </HStack>
                  </HStack>
                ))}
              </Stack>
            )}
          </>
        ) : (
          <>
            <Text type="supporting">Arena 未收录。这不代表能力差。</Text>
            <Button label={`查看 Arena ${board} 榜`} href={`/leaderboards/${board}`} size="sm" />
          </>
        )}
      </Stack>
    </Card>
  )
}

export default async function ModelPage({ params }: Props) {
  const { lab, model } = await params
  const detail = catalog.getDetail(`${lab}/${model}`)
  if (!detail) notFound()
  const {
    model: found,
    row,
    offers,
    textScores,
    webdevScores,
    textPrimary,
    webdevPrimary,
    textDomain,
    webdevDomain,
  } = detail
  const aaUrl = found.aaUrl ?? AA_LEADERBOARD_URL
  const modalities = `${found.modalities.input.join(' / ') || '未提供'} → ${found.modalities.output.join(' / ') || '未提供'}`
  const hasToolCall = offers.some(offer => offer.capabilities.toolCall)
  const hasStructuredOutput = offers.some(offer => offer.capabilities.structuredOutput)

  const path = modelHref(found.canonicalModelId)
  const pageDescription = found.description ?? `${found.name} 的价格、上下文、推理等级和 Arena 评分。`

  return (
    <Stack className="sheet-inner" gap={4}>
      <JsonLd data={webPageLd({ name: found.name, description: pageDescription, path })} />
      <JsonLd
        data={breadcrumbLd([
          { name: '模型目录', path: '/' },
          { name: found.name, path },
        ])}
      />
      <Breadcrumbs label="面包屑">
        <BreadcrumbItem href="/">模型目录</BreadcrumbItem>
        <BreadcrumbItem isCurrent>{found.name}</BreadcrumbItem>
      </Breadcrumbs>

      <HStack className="detail-head" justify="between" align="start" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <Heading level={1}>{found.name}</Heading>
          <HStack gap={1} vAlign="center">
            <Text type="supporting">{found.lab}</Text>
            <Text type="supporting">·</Text>
            <Text type="code">{found.canonicalModelId}</Text>
          </HStack>
          <HStack gap={1} wrap="wrap">
            <StatusBadges
              availability={found.availability}
              releaseBadges={found.releaseBadges}
              openWeights={found.openWeights}
              unmarked={row.unmarked}
            />
          </HStack>
        </Stack>
        <HStack gap={2} wrap="wrap" className="detail-actions">
          <CompareButton modelId={found.id} primary />
          <Button
            label="外部评测 · AA"
            href={aaUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          />
        </HStack>
      </HStack>

      <Grid columns={{ minWidth: 220, max: 4 }} gap={3}>
        <Card padding={3}>
          <Stack gap={1}>
            <Text type="supporting">价格 · 输入 / 输出</Text>
            {row.price ? (
              <HStack gap={3} wrap="wrap">
                <Text>
                  输入 <Text weight="semibold" hasTabularNumbers>{fmtRange(row.price.inputMin, row.price.inputMax)}</Text>
                </Text>
                <Text>
                  输出 <Text weight="semibold" hasTabularNumbers>{fmtRange(row.price.outputMin, row.price.outputMax)}</Text>
                </Text>
              </HStack>
            ) : (
              <Text type="large" color="secondary">未公布</Text>
            )}
            <Text type="supporting">
              {row.price ? 'USD / 1M tokens' : 'models.dev 未提供价格'}
              {row.price && <CnyPricePair {...row.price} fx={fx} />}
            </Text>
          </Stack>
        </Card>
        <Card padding={3}>
          <Stack gap={1}>
            <Text type="supporting">上下文</Text>
            <Text type="large" weight="semibold" hasTabularNumbers>{fmtContext(row.context)}</Text>
            <Text type="supporting">输出上限 {fmtContext(row.outputLimit)}</Text>
          </Stack>
        </Card>
        <ScoreSpec label="Arena text" score={textPrimary} domain={textDomain} />
        <ScoreSpec label="Arena webdev" score={webdevPrimary} domain={webdevDomain} />
      </Grid>

      <OfferTable offers={offers} hasPrimary={row.providerNames.length > 0} />

      <Grid columns={{ minWidth: 360, max: 2 }} gap={4} align="start">
        <Stack as="section" gap={3} aria-labelledby="arena-title">
          <Stack gap={0.5}>
            <Heading level={2} id="arena-title">Arena 评测</Heading>
            <Text type="supporting">分榜展示 · 不跨榜比较</Text>
          </Stack>
          <Grid columns={{ minWidth: 260, max: 2 }} gap={3}>
            <ArenaCard board="text" label="Arena text" primary={textPrimary} scores={textScores} domain={textDomain} />
            <ArenaCard board="webdev" label="Arena webdev" primary={webdevPrimary} scores={webdevScores} domain={webdevDomain} />
          </Grid>
          <Text type="supporting">
            Arena rating 是偏好评分，不是准确率；置信区间重叠时不宣称显著优劣。text / webdev 是两个独立 Board。
          </Text>
        </Stack>

        <Card padding={4}>
          <Stack gap={3}>
            <Heading level={2}>能力与模态</Heading>
            {found.description && <Text type="supporting">{found.description}</Text>}
            <MetadataList label={{ position: 'start' }}>
              <MetadataListItem label="输入 / 输出模态">{modalities}</MetadataListItem>
              <MetadataListItem label="工具调用">{hasToolCall ? '支持' : '未提供'}</MetadataListItem>
              <MetadataListItem label="结构化输出">{hasStructuredOutput ? '支持' : '未提供'}</MetadataListItem>
              <MetadataListItem label="知识截止">{found.knowledgeCutoff || '未提供'}</MetadataListItem>
              <MetadataListItem label="开源权重">{found.openWeights ? '是' : '否'}</MetadataListItem>
              <MetadataListItem label="推理等级">{found.reasoningLabel}</MetadataListItem>
              <MetadataListItem label="发布">{fmtDate(found.releaseDate)}</MetadataListItem>
              <MetadataListItem label="输出上限">{fmtContext(row.outputLimit)}</MetadataListItem>
              <MetadataListItem label="报价条目">{offers.length} 条</MetadataListItem>
              <MetadataListItem label="数据快照">{modelsDevDate}</MetadataListItem>
            </MetadataList>
          </Stack>
        </Card>
      </Grid>

      <Text type="supporting">
        models.dev（MIT）· Arena HuggingFace（CC BY 4.0）· 快照 {modelsDevDate} · 汇率 ECB / Frankfurter {fx.as_of} ·
        价格以供应商官网为准；Arena 分数为 latest 快照，保留 condition 与日期 · Artificial Analysis 仅外链，不嵌入分数 ·
        本站非官方，模型与商标归各自所有者 ·{' '}
        <AstryxLink href="/about">数据说明</AstryxLink>
      </Text>
    </Stack>
  )
}
