# Attribution and Data Licenses

Model Hub is an unofficial, read-only directory. Model names and provider names are used only to refer to the corresponding products. All trademarks belong to their respective owners. No third-party logos or images are used.

## models.dev

- Source: https://models.dev
- Repository: https://github.com/anomalyco/models.dev
- License: MIT License, Copyright (c) 2025 models.dev
- License text: https://github.com/anomalyco/models.dev/blob/dev/LICENSE

We use models.dev model, pricing, context, reasoning-option, modality, and provider fields. The pipeline selects the launch set, normalizes fields, derives offer availability, deduplicates regional offers, and converts prices only at display time. Source field values are otherwise preserved. The MIT copyright and permission notice applies to the upstream data and code.

The upstream project describes the API as MIT-licensed. Whether every contributed data row is covered by that license is a question for the upstream maintainers; this project does not grant additional rights to upstream data.

## LMArena Leaderboard Dataset

- Dataset: https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset
- Publisher: LMArena
- License: Creative Commons Attribution 4.0 International (CC BY 4.0)
- License text: https://creativecommons.org/licenses/by/4.0/

We use the `text` and `webdev` configurations. Changes made for display:

- `text` is filtered to `category=overall`; `webdev` is filtered to `category=webdev`.
- For each board, model, and organization, we keep the latest `leaderboard_publish_date`; ties use the highest `vote_count`.
- Arena model names are mapped to Model Versions with a manually reviewed crosswalk. Unmatched rows are retained as unmatched and are not linked to model pages.
- Ratings, confidence intervals, ranks, votes, dates, conditions, and source references are shown without aggregating conditions or combining boards.
- Scores are presented as preference evidence, not as commercial product ratings. No `AggregateRating` or `Review` structured data is generated.

## Artificial Analysis

- Site: https://artificialanalysis.ai
- We store only an optional external model-page URL. We do not embed AA scores, call AA APIs, scrape AA pages, or mirror AA content.
- URLs were verified against public search-index results only. Unverified or missing links fall back to the AA leaderboard.
- No partnership, certification, or endorsement by Artificial Analysis is implied. AA terms must be reviewed again before public launch.

## Exchange rates

USD→CNY display conversion uses European Central Bank reference rates obtained through the public Frankfurter API (https://frankfurter.dev). The rate and its effective date are recorded in `data/fx.yml` and `data/latest/manifest.json`. Conversions are approximate, are not transaction rates, and are hidden when the rate is older than 14 days.

## Typefaces

- IBM Plex Sans and IBM Plex Mono, Copyright 2019 IBM Corp. All rights reserved.
- License: SIL Open Font License, Version 1.1 — https://scripts.sil.org/OFL
- Project: https://github.com/IBM/plex
- Delivery: self-hosted via the `@fontsource/ibm-plex-sans` and `@fontsource/ibm-plex-mono` packages; the font files are served with the site's static assets. The Latin subset is used; Chinese text falls back to the system sans-serif.

## Data snapshot licensing

Third-party source data remains subject to the upstream licenses above. The MIT License in `LICENSE` covers this project's original code and documentation, not third-party model data, trademarks, or Artificial Analysis content. No license is granted for third-party marks.

## Corrections and removal requests

Open a correction or removal request at https://github.com/sunven/model-hub/issues/new/choose with the page URL, field, current value, proposed value, and a verifiable source. Rights holders may request removal; we will hide the disputed entry while verifying and keep an internal record of the request.
