# Session Handoff — 2026-06-25 — db-dynamodb DI Features Design

## What was done

- Designed and spec'd full DI restructure of `packages/db-dynamodb` — four new abstractions: DynamoDbDocumentClient, DynamoDbTableFactory, DynamoDbEntityFactory, DynamoDbBatchFactory
- Ran 4 review passes (29 total findings fixed) via subagent code reviewers against the actual codebase
- Created 11-task implementation plan split into per-task files for parallel agent execution
- 6 commits in this session (design + plan work only, no code changes)

## Key decisions

- `DynamoDbDocumentClient` is a plain interface + namespace, not a `createAbstraction` token — instances are factory-created, not DI-resolved
- `DynamoDbTableFactory` resolves the single `DynamoDBDocument` from existing `DynamoDBClient` DI abstraction — consumers never thread `documentClient` manually
- `Entity` class delegates batch creation to `DynamoDbBatchFactory` — decorating the factory affects all batch operations system-wide
- Internal features use `createFeature` (not `createImplementation`) — consistent with existing `DynamoDBClientFeature` pattern
- `DynamoDocClient` renamed to `DynamoDbDocumentClient` — user prefers full names over abbreviations
- `feature/` (singular) renamed to `features/` (plural) — matches convention in api-core, api-headless-cms
- No backwards compatibility — `createTable()`, `createStandardEntity()`, `createGlobalEntity()` are deleted, not deprecated
- `indexes` param on table factory is a no-op — `DynamoDbDocumentClient` resolves index keys dynamically at query time

## Current state

- Branch: `bruno/refactor/db-dynamodb-toolbox`, 10 commits ahead of origin/next (not pushed)
- Previous session's dynamodb-toolbox removal is complete and tested (203 tests, 126-package build)
- This session produced spec + plan only — no code changes to the package itself
- Spec: `docs/.bruno/specs/2026-06-25-db-dynamodb-di-features-design.md`
- Plan: `docs/.bruno/plans/db-dynamodb-di-features/` (11 task files)

## What might come next

- Execute the implementation plan (Tasks 1-4 parallel, then Task 5, then Tasks 6-10 parallel, then Task 11)
- Tasks 1-4 create new feature files alongside existing code — safe to run in parallel
- Task 5 is the atomic internal switch — biggest task, must be sequential
- Tasks 6-10 are consumer migrations — each touches a different package, fully parallel
- After all tasks: push branch and create PR against `next`
- Consider running full CMS test suite (12 shards) to validate no regressions
