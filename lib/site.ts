const fallbackSiteUrl = 'https://model-hub.example'

function normalizeSiteUrl(value: string | undefined): string {
  try {
    return new URL(value || fallbackSiteUrl).origin
  } catch {
    return fallbackSiteUrl
  }
}

export const SITE_URL = normalizeSiteUrl(process.env.SITE_URL)
export const SITE_NAME = 'Model Hub'
export const SITE_DESCRIPTION =
  '面向中文开发者的只读模型信息市场：比较模型版本的价格、上下文、推理等级和 Arena 偏好评分。'
export const LOCALE = 'zh_CN'
export const OG_IMAGE = '/og.png'
export const REPO_URL = 'https://github.com/sunven/model-hub'
export const ISSUES_URL = `${REPO_URL}/issues`
export const NEW_ISSUE_URL = `${REPO_URL}/issues/new/choose`
export const ATTRIBUTION_URL = `${REPO_URL}/blob/main/ATTRIBUTION.md`
export const LEGAL_REVIEW_URL = `${REPO_URL}/blob/main/docs/legal-review.md`

export function absoluteUrl(path = '/'): string {
  return new URL(path, `${SITE_URL}/`).toString()
}

export function modelHref(canonicalId: string): string {
  return `/models/${canonicalId}`
}
