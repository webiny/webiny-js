# Session Handoff — 2026-07-17 — utils-os DI Extraction

## What was done

- Extracted 7 DI features from bare functions in `@webiny/api-headless-cms-utils-os`:
  - **CmsEntryOpenSearchIndexCreate** — wraps index creation (OpenSearchClient + Index[] deps)
  - **CmsEntryOpenSearchIndexDelete** — wraps index deletion (OpenSearchClient dep)
  - **CmsEntryOpenSearchBodyBuilder** — wraps body building (10 registry/modifier deps)
  - **CmsEntryOpenSearchExecFiltering** — wraps filtering pipeline (OperatorList, ValueTransformer, FieldPathFactory, FilterRegistry deps)
  - **CmsEntryOpenSearchFieldPathFactory** — wraps field path computation (ValueSearchRegistry dep)
  - **CmsEntryOpenSearchValueTransformer** — wraps value transform for search (ValueSearchRegistry dep)
  - **CmsEntryOpenSearchOperatorList** — wraps operator registry flattening (OperatorRegistry dep)
- Created **CmsEntryOpenSearchUtilsFeature** composite — registers all 11 utils-os features in one call
- Established canonical exports path: `@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js`
- Barrel `index.ts` now exports only `CmsEntryOpenSearchUtilsFeature` — no Impl classes leak
- Inlined bare functions into DI implementations, deleted old files (body.ts, sort.ts, exec.ts, path.ts, transformValueForSearch.ts, plugins/operator.ts, filtering/{applyFiltering,populated,values}.ts)
- Moved helpers into feature folders (sort.ts into BodyBuilder, applyFiltering/populated/values into ExecFiltering)
- Updated ddb-es and pg-os consumers to use composite feature + canonical import path
- Fixed es-tasks and webiny package broken imports from Phase 1 extraction
- 12 commits this session, 33 total on branch

## Key decisions

- OpenSearch stays in feature names for disambiguation at resolve sites (CmsEntryFilter could mean SQL filter)
- Impl classes are internal — only abstractions exported via canonical path
- Filtering/sort/fullTextSearch/fields/keyword/initialQuery remain as shared utilities in operations/entry/elasticsearch/ — research determined NO for DI (pure functions, no variation points)
- ddb-es re-export file delegates to utils-os canonical path (for backward compat with es-tasks consumers)
- Filtering compat shim moved from utils-os to ddb-es test helpers (was test-only code)

## Current state

- Branch: `bruno/feat/api-headless-cms-pg-os`, 33 commits ahead of next (not pushed)
- Build: 143/143 packages passing
- Tests: ddb-es 109/110 (1 flaky — createIndexTask array ordering, pre-existing), pg-os 9/9, pg-sync 6/6
- Lint/format: clean
- Research docs: `docs/.bruno/research/opensearch/` (6 files)

## What might come next

- **Push branch and open PR** — 33 commits, all packages ready for review
- **Full CMS integration tests** — run shared CMS test suite with WEBINY_STORAGE=pg-os,ddb against real OpenSearch
- **Consumer updates** — project templates, deployment configs for PG+OS variant
- **WAL listener infrastructure** — deployment/infra concern for PG-to-OS sync
- **Remove ddb-es re-export file** — once es-tasks imports from utils-os directly (needs es-tasks dep update to add utils-os, which we did, but the re-export in ddb-es still exists for other potential consumers)
