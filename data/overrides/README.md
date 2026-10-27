# Overrides

`overrides.yml` is the only manual correction layer applied after normalization. Upstream data remains authoritative by default.

Every entry is validated against the field allowlist and value type, then recorded in `manifest.overrides.applied` with author, reason, creation time, and source URL. Duplicate target/field entries are reported; conflicting duplicates are not applied. Schema and type errors are hard failures and prevent snapshot promotion. A missing target is a warning so stale corrections do not silently change unrelated data.

Allowed model fields: `name`, `lab`, `family`, `releaseDate`, `knowledgeCutoff`, `openWeights`, `aaUrl`, `availability`, `reasoningLabel`.

Allowed offer fields: `status`, `providerKind`, `price`. A price override is a partial object merged into the existing price; use `null` to remove a price.

Crosswalk files under `data/crosswalk/` remain separate because they are reviewed mappings rather than field patches. The AA link can also be corrected as a model `aaUrl` override.

Published JSON Schema: `data/schema/overrides.schema.json`.
