# Session Handoff — 2026-09-10 — Simple Content Entries

## What was done

17 commits on `claude/simple-content-entries`, 98 files, ~5,100 insertions. PR
[#5678](https://github.com/webiny/webiny-js/pull/5678) (draft).

**Simple content entries** — a reduced CMS entry, base code only. Five operations reached through
code; no GraphQL, no admin UI, no domain events.

- **The shape** — `ISimpleCmsEntry`, eleven fields. Seven carry identity and payload; four are
  pinned (`version: 1`, `status: "draft"`, `locked: false`, `expiresAt: null`). 26 of the 28 entry
  and revision meta fields are gone; `createdOn` and `createdBy` survive. Derived by auditing what
  each backend actually reads off the entry, not by guessing.
- **Five slices** in `packages/api-headless-cms/src/features/simpleContentEntries/` —
  create, update, get, list, delete. Each is six files: `abstractions/` with one file per
  abstraction plus a barrel, use case, repository, `feature.ts`, `index.ts`.
- **Nothing in the `api-headless-cms-*` storage packages changed.** That was the design constraint.
- **Two guards, both in the repositories** (the last layer before storage, so no caller can bypass
  them): `assertSimpleModel` on the five simple repositories, `assertRegularModel` on the twelve
  mutating regular ones.
- **`EntryDataProcessor`** — new injectable service wrapping entry validation and reference-field
  mapping, so data factories stop importing from `~/crud/`. `CreateEntryDataFactory` and both simple
  factories use it and lose their `CmsContext` dependency.
- **Docs** — `DEVELOPERS.md` beside the feature; design, spec and plan in `docs/.bruno/`;
  `AGENTS.md` and `ai-context/core-features-reference.md` updated.
- **Public surface** — `exports/api/cms/simpleEntry.ts`, mirrored into the `webiny` barrel as
  `webiny/api/cms/simpleEntry` by the export generator.

**76 new tests** across six files: five unit suites plus a storage-backed integration suite.

## Key decisions

- **A simple entry is always a single unpublished draft.** Enforced four ways: literal types,
  `readonly`, `assertSimpleEntryInvariants` in both write repositories, and `assertRegularModel`
  keeping the regular publishing operations away from a simple model entirely. The update factory
  re-applies the pinned fields from constants rather than copying them off the original, so a
  stored record that broke the invariant is normalized rather than propagated.
- **Opt-in by tag.** `SIMPLE_MODEL_TAG` (`"cms:simple"`) in `model.tags`. Needs no type or
  model-builder change since `tags` already exists. It guards both directions.
- **Reads stay open.** The ten read-only regular repositories are deliberately unguarded, so a
  simple entry remains readable through `getEntry` and `listEntries`. The invariant is a
  write-side guarantee.
- **`sort` is a template-literal type**, not `string[]` — `id`, `createdOn`, `values.*` only. A
  simple model gets its own OpenSearch index, so a dropped meta field is unmapped there and sorting
  on one fails at query time. The type turns that into a compile error.
- **Listing pins `latest: true`.** OpenSearch requires `latest` or `published` and refuses to
  default it; DynamoDB defaults silently. Passing neither is green on one backend and throws on the
  other.
- **No domain events**, deliberately. Combined with no GraphQL, a simple entry write currently has
  no hook at all — anything needing to react to one must add events to these slices first.
- **Structure follows `webiny-api-architect` and `ai-context/code-style/`**, with
  `app-audit-logs/src/features/listAuditLogs/` as the precedent: camelCase feature dirs, one
  abstraction per file, one class per file. This diverges from `contentEntry/`, which predates
  those rules.

## Current state

- Branch: `claude/simple-content-entries`, 17 commits ahead of `next`, PR #5678 open as draft
- Checks: `oxfmt --check`, `oxlint`, `adio`, `check-ts-configs`, `yarn build` — all green
- Tests: **996 passed / 0 failed on every reachable backend** — ddb (412s), sql (264s), ddb-os
  (686s). Identical totals on all three, so the OpenSearch list fix regressed nothing.
- Logs for every run are in the session scratchpad under `test-results/`, each with a header
  recording backend, target, commit and timestamps

### Caveats

- **`pg-os` is not verifiable.** `WEBINY_STORAGE=pg-os` registers no CMS entry storage operations,
  because `PgOsCreateEntry` is a decorator needing a base backend underneath while the preset loop
  selects exactly one storage-operations package. `pg-os,sql` fails identically; `sql,pg-os` passes
  only because SQL is what gets picked. Infrastructure limitation, not specific to this feature — no
  CMS feature is currently verifiable on `pg-os`.
- **Storage suites skip silently without a flag** and still exit 0. Every claim above was confirmed
  live by breaking an assertion and checking the backend fails.
- **Two commits cancel out** — `fix(webiny): drop the orphaned event-handler-core dependency` and its
  revert. The removal was correct when made; the rebase brought in #5673, which restored the usage as
  deep-path imports. Both can be dropped when history is tidied.
- **Substantive changes landed in `chore: lint and format` commits** — the OpenSearch list fix and
  two integration tests among them. Worth splitting before merge.
- The branch also carries `docs: add activity log design and inconsistency review`, unrelated to
  this feature.

## What might come next

1. **Decide whether the `HttpRouteHandler` barrel change was intentional.** Resolved as incidental —
   #5673 replaced bare specifiers with deep paths — but worth a second pair of eyes.
2. **Tidy branch history** and mark PR #5678 ready for review.
3. **Migrate the remaining four regular data factories** to `EntryDataProcessor`; they still import
   from `~/crud/`.
4. **Add domain events** if anything needs to react to a simple entry write — currently impossible.
5. **A GraphQL surface**, if simple entries ever need to be reachable from outside code. Additive;
   changes nothing built so far.
6. **`pg-os` test infrastructure** — the preset system cannot express a decorator over a base
   backend. Worth fixing for the whole CMS, not just this feature.
