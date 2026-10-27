# Pre-launch legal and compliance review

This document is a working checklist, not legal advice. It must be reviewed by a human before any public deployment under a real domain.

Status date: 2026-10-27

## Product facts

- The site is an unofficial, read-only directory. It has no accounts, comments, cookies, analytics, or payments.
- Model, pricing, context, and reasoning data come from models.dev (MIT).
- Arena ratings come from the LMArena Leaderboard Dataset (CC BY 4.0).
- Artificial Analysis is link-only: no embedded scores, API calls, or page scraping.
- USD→CNY conversion uses ECB reference rates via Frankfurter and is display-only.
- The site is currently local-only. No public deployment has been made.

## Technical controls completed

- [x] models.dev attribution, MIT notice, and source link appear in the footer, `/about`, README, and `ATTRIBUTION.md`.
- [x] LMArena attribution, CC BY 4.0 link, and a concrete modification statement appear in the footer, `/about`, README, and `ATTRIBUTION.md`.
- [x] AA is described as external-only; no AA scores are stored or rendered; unverified links fall back to the AA leaderboard.
- [x] Non-official and trademark disclaimer is visible in the footer and `/about`.
- [x] Price, FX source/date, 14-day staleness rule, and non-financial-advice disclaimer are documented and implemented.
- [x] Privacy statement covers no accounts/cookies/analytics, URL state, GitHub Issues, and possible static-host access logs.
- [x] Correction and removal issue forms exist, including a source/evidence field.
- [x] External links use `rel="noopener noreferrer"`.
- [x] No third-party logos or images are bundled.
- [x] Public repository and Issues entry point are available at https://github.com/sunven/model-hub.

## Human sign-off required before public deployment

- [ ] Confirm models.dev's current terms cover the specific data fields and contributions used here; contact upstream if the contribution-data license is unclear.
- [ ] Review the current Artificial Analysis terms for external-link usage. Do not automate access to AA.
- [ ] Confirm the CC BY 4.0 attribution and modification statement are sufficient for the LMArena dataset.
- [ ] Confirm the privacy statement against the eventual hosting provider's access-log and subprocessor practices.
- [ ] Publish a private contact channel for sensitive rights-holder requests (email or equivalent). Until then, Issues is the only public channel.
- [ ] Confirm the FX source/date review owner and cadence (weekly recommended).
- [ ] Confirm the public repository contains no confidential material and that the commit author identity is acceptable.
- [ ] After deployment, verify the public Issues link, removal process, and site-wide disclaimers on the live domain.

## Deliberately deferred

- Public deployment, custom domain, and mainland-China ICP filing: deferred by the project owner.
- Per-model Open Graph images: not required for the first release.
