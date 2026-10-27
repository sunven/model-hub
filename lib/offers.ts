import type { Offer } from './snapshot'

const PROVIDER_KIND_ORDER: Record<Offer['providerKind'], number> = {
  first_party: 0,
  cloud: 1,
  gateway: 2,
}

export function compareOffers(a: Offer, b: Offer): number {
  const kind = PROVIDER_KIND_ORDER[a.providerKind] - PROVIDER_KIND_ORDER[b.providerKind]
  if (kind) return kind
  const ap = a.price?.output ?? Number.POSITIVE_INFINITY
  const bp = b.price?.output ?? Number.POSITIVE_INFINITY
  return ap - bp || a.providerName.localeCompare(b.providerName)
}
