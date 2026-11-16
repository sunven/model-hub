'use client'

import { Button } from '@astryxdesign/core/Button'
import { HStack } from '@astryxdesign/core/HStack'
import { Icon } from '@astryxdesign/core/Icon'
import { Selector } from '@astryxdesign/core/Selector'
import { StackItem } from '@astryxdesign/core/Stack'
import { defaultSortDirection, type ExploreQuery, type SortKey } from '@/lib/explore-query'

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'arena_text', label: 'Arena text 评分' },
  { value: 'arena_webdev', label: 'Arena webdev 评分' },
  { value: 'price', label: '输出价格' },
  { value: 'context', label: '上下文长度' },
  { value: 'newest', label: '发布日期' },
]

export default function ExploreSort({ query, update }: {
  query: ExploreQuery
  update: (patch: Partial<ExploreQuery>) => void
}) {
  return (
    <HStack gap={2} vAlign="end">
      <StackItem size="fill">
        <Selector
          label="排序方式"
          options={sortOptions}
          value={query.sortKey}
          onChange={value => {
            const sortKey = sortOptions.find(option => option.value === value)?.value
            if (sortKey) update({ sortKey, sortDirection: defaultSortDirection(sortKey) })
          }}
          width="100%"
        />
      </StackItem>
      <Button
        label={query.sortDirection === 'asc' ? '升序' : '降序'}
        variant="secondary"
        icon={<Icon icon={query.sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size="sm" />}
        onClick={() => update({ sortDirection: query.sortDirection === 'asc' ? 'desc' : 'asc' })}
      />
    </HStack>
  )
}
