'use client'

import { useMemo, useState } from 'react'
import type { Offer } from '@/lib/types'
import {
  fmtContext,
  fmtMoney,
  offerStatusClass,
  offerStatusLabel,
  providerKindLabel,
  reasoningText,
} from '@/lib/format'

export function OfferTable({ offers }: { offers: Offer[] }) {
  const hasPrimary = offers.some(o => o.providerKind !== 'gateway')
  const [showGateways, setShowGateways] = useState(!hasPrimary)
  const [showDeprecated, setShowDeprecated] = useState(false)

  const visible = useMemo(
    () =>
      offers
        .filter(o => (showGateways || o.providerKind !== 'gateway') && (showDeprecated || o.status !== 'deprecated'))
        .sort((a, b) => {
          const order = { first_party: 0, cloud: 1, gateway: 2 } as const
          const kind = order[a.providerKind] - order[b.providerKind]
          if (kind) return kind
          const ap = a.price?.output ?? Number.POSITIVE_INFINITY
          const bp = b.price?.output ?? Number.POSITIVE_INFINITY
          return ap - bp || a.providerName.localeCompare(b.providerName)
        }),
    [offers, showGateways, showDeprecated],
  )

  return (
    <section className="panel">
      <div className="offers-head">
        <h2>
          托管报价 <span className="sub">{visible.length} 条可见 · 默认折叠网关 / 已弃用</span>
        </h2>
        <div className="offer-toggles">
          <label className="mini-check">
            <input type="checkbox" checked={showGateways} onChange={e => setShowGateways(e.target.checked)} />
            显示网关报价
          </label>
          <label className="mini-check">
            <input type="checkbox" checked={showDeprecated} onChange={e => setShowDeprecated(e.target.checked)} />
            显示已弃用报价
          </label>
        </div>
      </div>

      {!hasPrimary && (
        <p className="source-box" style={{ marginBottom: 8 }}>
          该模型目前只有网关报价；默认展示，避免误以为没有可用报价。
        </p>
      )}

      {visible.length ? (
        <>
          <div className="offer-table-wrap" style={{ overflow: 'auto' }}>
            <table className="offer-table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>Input</th>
                  <th>Output</th>
                  <th>Cache</th>
                  <th>Context</th>
                  <th>Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(offer => (
                  <tr key={offer.id}>
                    <td className="offer-provider">
                      {offer.providerName}
                      <div className="model-sub">{offer.providerModelId}</div>
                    </td>
                    <td>{providerKindLabel(offer.providerKind)}</td>
                    <td>
                      <span className={`badge ${offerStatusClass(offer.status)}`}>{offerStatusLabel(offer.status)}</span>
                    </td>
                    <td className="num">{fmtMoney(offer.price?.input)}</td>
                    <td className="num">{fmtMoney(offer.price?.output)}</td>
                    <td className="num">{fmtMoney(offer.price?.cacheRead)}</td>
                    <td className="num">{fmtContext(offer.limits.context)}</td>
                    <td className="offer-reason">{reasoningText(offer.capabilities.reasoningOptions, offer.capabilities.reasoning)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mobile-offer-list">
            {visible.map(offer => (
              <div className="mobile-offer" key={offer.id}>
                <div className="mobile-offer-top">
                  <strong>{offer.providerName}</strong>
                  <span className={`badge ${offerStatusClass(offer.status)}`}>{offerStatusLabel(offer.status)}</span>
                </div>
                <div className="mobile-offer-meta">
                  {providerKindLabel(offer.providerKind)} · {offer.providerModelId}
                </div>
                <div className="mobile-offer-prices">
                  <span>Input<b>{fmtMoney(offer.price?.input)}</b></span>
                  <span>Output<b>{fmtMoney(offer.price?.output)}</b></span>
                  <span>Context<b>{fmtContext(offer.limits.context)}</b></span>
                </div>
                <div className="mobile-offer-reason">
                  {reasoningText(offer.capabilities.reasoningOptions, offer.capabilities.reasoning)}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="empty" style={{ padding: 24 }}>
          当前筛选下没有可见报价。打开上面的开关查看网关 / 已弃用报价。
        </div>
      )}
      <p className="source-box" style={{ marginTop: 9 }}>
        价格单位 USD / 1M tokens；“未公布”不是 $0；“免费”才表示 0。默认只展示第一方 + 主要云平台。
      </p>
    </section>
  )
}
