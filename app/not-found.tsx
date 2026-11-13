import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { List, ListItem } from '@astryxdesign/core/List'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { catalog } from '@/lib/data'
import { modelHref } from '@/lib/site'

const picks = catalog.topText(8)

export default function NotFound() {
  return (
    <Stack className="sheet-inner" gap={4}>
      <EmptyState
        headingLevel={1}
        title="没有找到这个页面"
        description="模型可能不在当前目录里，或者链接已经失效。"
        actions={
          <HStack gap={2} wrap="wrap">
            <Button label="返回模型表" href="/" variant="primary" />
            <Button label="查看 Arena 榜单" href="/leaderboards/text" variant="secondary" />
          </HStack>
        }
      />
      <Text as="p" type="supporting">
        链接可能来自旧版本，目录随数据快照更新。也可以从评分最高的模型或榜单重新开始；共收录{' '}
        {catalog.rows.length} 个模型版本。
      </Text>
      <Card padding={4}>
        <Stack gap={2}>
          <HStack justify="between" vAlign="center" gap={2} wrap="wrap">
            <Heading level={2}>评分最高的模型</Heading>
            <Text type="supporting">浏览全部 {catalog.rows.length} 个模型</Text>
          </HStack>
          <List hasDividers density="compact">
            {picks.map(model => (
              <ListItem
                key={model.id}
                label={model.name}
                description={model.lab}
                href={modelHref(model.canonicalId)}
                startContent={<Text weight="medium" hasTabularNumbers>#{model.text!.rank}</Text>}
                endContent={<Text weight="semibold" hasTabularNumbers>{model.text!.rating.toFixed(1)}</Text>}
              />
            ))}
          </List>
        </Stack>
      </Card>
    </Stack>
  )
}
