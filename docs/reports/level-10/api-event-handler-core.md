# @webiny/api-event-handler-core

> Level 10 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-event-handler-core` contains exactly one export, `registerApiRequestStack`, which is the transport-agnostic per-request composition root for the entire Webiny API: it registers, in a strict and carefully documented order, every domain feature (API core, headless CMS + its ACO/tasks/workflows/scheduler add-ons, file manager, website builder, websockets, mailer, record locking, audit logs, webhooks, ACO, background tasks, workflows, scheduler) plus the GraphQL engine, and gives the caller three narrow injection points (`registerRequestStorage`, and `transports.{realtime,scheduler,fileManager}`) so the AWS and standalone hosting packages can each supply their own transport/storage adapters without duplicating or reordering the domain-feature list. Because both `@webiny/api-event-handler-aws` and `@webiny/api-event-handler-standalone` call this single function, the two deployment types cannot silently drift on which domain features get registered — any drift has to happen at the transport/root-container layer one level up, which is where this audit found the one confirmed inconsistency (see the sibling reports for `api-event-handler-aws`/`api-event-handler-standalone`).

## Public API
- `registerApiRequestStack` (`packages/api-event-handler-core/src/registerApiRequestStack.ts:81`) — the sole export. Two direct consumers, both composition-root packages: `@webiny/api-event-handler-aws`'s `registerWebinyApiChild.ts` and `@webiny/api-event-handler-standalone`'s `createWebinyApiHandler.ts` (plus that package's `createWebsocketsAuthenticator.ts`, which calls it a second time to bootstrap a minimal per-connection container for WebSocket auth).
- `RegisterApiRequestStackConfig` / `TransportRegistrar` (same file) — the injection-point types; used by the same two consumers to type their `transports` object.

## Bugs
None found. The function is a straight, well-commented sequence of `Feature.register()` calls with no branching logic to get wrong; the load-bearing ordering constraints (WCP license refresh first, extensions before anything that caches the model set, GraphQL engine last) are each explained inline and match what the two callers actually do.

## Duplication
N/A — single 146-line file, no internal duplication (jscpd: 0 clones), and the whole point of the file is to eliminate duplication between the AWS and standalone composition roots.

## Dead code
None. The one export is consumed by both transport packages.

## Convention issues
None meaningful — one file, one exported function plus its config type, DI-native, well documented.

## Test gaps
There are no tests at all in this package (no `__tests__` directory). `registerApiRequestStack` is only exercised indirectly through the two consuming packages' own tests (`api-event-handler-aws`'s `registerInboundEventTypes.test.ts`/`S3TenantLoaderDecorator.test.ts` and `api-event-handler-aws-ddb`'s `freshInstall.test.ts`, which boots the full stack against a fresh DB). There is no test that asserts the ordering invariants the extensive comments call out as load-bearing (e.g. that extensions register before anything lists/caches CMS models, or that the scheduler transport hook runs between `SchedulerFeature` and `CmsSchedulerFeature`) — a future reorder-by-accident here would only be caught by an integration test noticing a downstream symptom, not by a focused unit test of this function.

## Recommendations
1. Add a lightweight unit test for `registerApiRequestStack` that resolves a container after registration and asserts the documented ordering invariants (e.g. that a `transports.scheduler` hook runs between `SchedulerFeature` and `CmsSchedulerFeature`'s effects) so the "ORDER IS LOAD-BEARING" comment is backed by something that fails loudly on a future refactor.
2. No functional changes needed otherwise — the package is small, single-purpose, and well-documented; keep it that way as more transports/storage variants are added (resist the temptation to grow config surface here instead of in the transport packages).
3. Since this function is the one place where a new domain feature must be added for it to reach production, consider a short contributor note (in the file header or AGENTS.md) pointing future feature authors here, to reduce the risk of a feature only being wired into one of the two composition roots by mistake.
