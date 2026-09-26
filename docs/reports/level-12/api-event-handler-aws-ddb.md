# @webiny/api-event-handler-aws-ddb

> Level 12 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-event-handler-aws-ddb` is a thin storage variant over `@webiny/api-event-handler-aws`: it supplies a `registerRootStorage` callback that registers the DynamoDB-only storage Features (core, headless CMS, audit logs, ACO, websockets) and hands it to the base package's `createWebinyApiHandler`/`createWebinyStreamApiHandler`. This is the AWS Lambda + DynamoDB deployment's actual Lambda entry point. The package is small (one 41-line source file plus a barrel), has no logic of its own beyond composing Feature registrations, and is in good health — it is also the one package in this audit slice with an integration-style test (`freshInstall.test.ts`, boots the whole GraphQL schema against a fresh DB).

## Public API
- `createAwsDdbApiHandler` / `createAwsDdbStreamApiHandler` (`src/createWebinyApiHandler.ts:31`, `:39`) — the two Lambda handler factories; these are the actual `handler` export a generated project's Lambda function points at. Consumers are project-level generated code (webiny.config / pulumi app templates), outside this monorepo's own package graph, plus this package's own `freshInstall.test.ts`.
- `CreateAwsDdbApiHandlerConfig` — the config type (a `Pick` of the base `CreateWebinyApiHandlerConfig`).

## Bugs
None found. The file is a straightforward composition of five `Feature.register()` calls with no conditional logic to get wrong.

## Duplication
N/A — jscpd reports 0 clones; single small file.

## Dead code
None. Both exported factories are the package's entire reason to exist and are exercised by `freshInstall.test.ts`.

## Convention issues
None meaningful.

## Test gaps
`freshInstall.test.ts` verifies the handler boots without a DI wiring failure on a fresh database, which is valuable as a smoke test, but does not exercise an actual HTTP request through the handler (e.g. that a GraphQL query resolves correctly, or that the DDB-specific storage Features actually produce working CRUD behavior end-to-end) — that coverage presumably lives in the downstream domain packages' own test suites, which is reasonable for a composition-only package like this one.

## Recommendations
1. No functional changes needed — the package is minimal, correct, and has a real (if narrow) test.
2. If a future storage variant is added, keep following this file's shape (a single `registerRootStorage` closure) rather than growing configuration surface in the base `api-event-handler-aws` package.
3. Consider one additional assertion in `freshInstall.test.ts` that a basic GraphQL query actually executes (not just that the schema builds), to catch storage-wiring regressions the current test would miss.
