# @webiny/telemetry

> Level 1 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
A small, hand-written (no `src/`, plain `.js` + hand-authored `.d.ts`) analytics package with three entry points — `cli.js` (Node/CLI identity via `@webiny/global-config`), `react.js` (browser identity via URL params/localStorage/env vars), and the shared `sendEvent.js` (payload validation + sanitisation before dispatch to `@webiny/wts-client`). Overall it is small and mostly careful (falls back gracefully when localStorage/files are missing), but the CLI opt-out path has a real ordering bug that silently drops the "user disabled telemetry" event it's supposed to send.

## Public API
- `sendEvent`, `enable`, `disable`, `isEnabled` from `packages/telemetry/cli.js` — consumed by `cli-aws/src/decorators/DeployCommandWithTelemetry.ts`, `create-webiny-project/src/services/Analytics.ts`, `project/src/features/IsTelemetryEnabled/IsTelemetryEnabled.ts`, and `cli-core/src/features/{Enable,Disable}TelemetryCommand.ts` (~5 files).
- `sendEvent`, `getMachineId` from `packages/telemetry/react.js` — consumed by `app-admin/src/features/telemetry/TelemetryService.ts` and `app-admin/.../FinishSetup/handleStartUsing.ts` (2 files).
- Both `sendEvent` variants funnel into the shared, non-exported `sendEvent.js` default export for payload validation/sanitisation.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | packages/telemetry/cli.js:8-12, 92-94, called from packages/cli-core/src/features/DisableTelemetryCommand.ts:14-15 | `sendEvent` re-checks `isEnabled()` (which reads the current `~/.webiny/config`) at the top of every call. `DisableTelemetryCommand` calls `disableTelemetry()` (sets `telemetry: false`) and then immediately `await sendEvent({ event: "disable-telemetry", ... })`. | Because `disable()` already flipped the config flag before `sendEvent` runs, `isEnabled()` now returns `false` and `sendEvent` short-circuits at cli.js:9-12 — the `disable-telemetry` event is never actually sent to WTS. The symmetric `enable-telemetry` event does fire correctly (enable happens before the flag would block it), so the bug is specific to the disable path and silently loses every opt-out analytics event. | high |
| 2 | low | packages/telemetry/cli.d.ts:9-10 | `enable()`/`disable()` are declared to return `boolean`, but the implementations in cli.js:88-94 are one-line arrow functions with no `return` statement, so they actually return `undefined`. | No in-repo caller currently uses the return value (`EnableTelemetryCommand.ts`/`DisableTelemetryCommand.ts` call them for side effect only), so this is currently harmless, but any new caller written against the `.d.ts` that branches on the return value would silently get `undefined` instead of `true`/`false`. | high |

## Duplication
`getWcpOrgProjectId` is duplicated verbatim (differing only in which env vars it reads) between `packages/telemetry/cli.js:63-70` and `packages/telemetry/react.js:131-138`, and the property-assembly block building `wcpProperties`/`installationProperties`/`hostingTypeProperties` (cli.js:23-44 vs react.js:99-114) is likewise a near-duplicate. No jscpd report exists for this package (no `src/` directory was scanned), but the duplication is easy to see by direct comparison and would be a natural candidate for a shared helper in `sendEvent.js`.

## Dead code
None found — `cli.js` and `react.js` exports each have at least one confirmed in-repo consumer (see Public API).

## Convention issues
The package has no `src/` directory and no TypeScript sources — it ships hand-written `.js` files with hand-written `.d.ts` declaration files instead of being compiled from `.ts`, unlike essentially every other package in this repo. This is the direct cause of bug #2: a hand-maintained type file can drift from the implementation with nothing to catch it (no compiler cross-checks the declaration against the arrow-function bodies).

## Test gaps
There are no tests anywhere in this package. In particular, nothing exercises: `isEnabled`'s `tracking`/`telemetry` backwards-compatibility fallback (cli.js:96-105), the enable/disable-then-sendEvent ordering (which would have caught bug #1), `sendEvent.js`'s validation error paths (missing `event`/`properties`/`wts`/`version`/`ci`/`newUser`), or `react.js`'s URL-param vs. localStorage vs. env-var precedence for `distinctId`/`installationId`.

## Recommendations
1. Fix the disable-telemetry ordering bug (packages/telemetry/cli.js and/or `DisableTelemetryCommand.ts`): send the opt-out event before flipping the config flag, or give `sendEvent` an explicit bypass for the disable-event itself, so the opt-out is actually recorded.
2. Correct or regenerate `cli.d.ts` so `enable`/`disable` are typed `void` (matching their real return value), removing the hand-maintenance drift risk noted above.
3. Add minimal unit tests for `sendEvent.js`'s validation branches and for `cli.js`'s `isEnabled`/`enable`/`disable` interaction, since this is the package that decides whether real user data gets sent anywhere.
