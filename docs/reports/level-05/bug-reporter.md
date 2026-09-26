# @webiny/bug-reporter

> Level 5 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/bug-reporter` is a self-contained admin-app extension (plus its API route) that lets any logged-in admin user file a GitHub issue with one click: a browser-side `ActionRecorder` continuously watches clicks, edits, route changes, failed/GraphQL fetches, `console.error`/`console.warn` calls and uncaught exceptions into a capped in-memory buffer, and a "Report a bug" command opens a dialog that lets the user add a description and pasted screenshots and submit. The API side streams progress back over SSE while a `SubmitBugReportUseCase` drafts the issue (a "verbatim" drafter by default), uploads screenshots to a dedicated `bug-report-assets` branch, and creates the GitHub issue (or, with no server GitHub token, hands back a prefilled "compose" URL the reporter opens and submits under their own account). The design is careful in several places (dropping URL fragments, never recording raw input *values*, capping report/URL sizes for compose mode) and the core use case is well tested, but the client-side truncation limits (event count, string length, screenshot count) are not re-enforced on the server, so the backend trusts a client-shaped payload more than it should. A couple of findings are security-sensitive and are detailed only in the private security notes (see Bugs). Nothing here reimplements a lower-level utility; it consumes `@webiny/app`'s `ApiStreamClient`/SSE reader, `@webiny/event-handler-core`'s `HttpRouteHandler`/`toSseFrame`, `@webiny/api-core`'s `IdentityContext`/`BuildParams`, and `@webiny/admin-ui`/`@webiny/feature`'s DI and dialog primitives correctly.

## Public API
- `BugReportFeature` (`src/admin/feature.ts:9`) — registers the recorder (singleton), the presenter (singleton), the gateway and the command-palette entry; resolved once by `BugReportMount`/`ReportBugDialog`/`ReportBugCommand`, all internal to this package. Not consumed elsewhere (codegraph: only 2 callers, both `Extension.tsx`).
- `BugReportMount` (`src/admin/BugReportMount.tsx:17`) — rendered unconditionally by the package's `Extension.tsx` in every project that includes `@webiny/bug-reporter`; starts the recorder on mount with no configuration gate.
- `SubmitBugReportRouteDefinition` (`src/api/SubmitBugReportRoute.ts:73`) — registers `POST /stream/bug-report`; the only backend surface, wired from the package's own `api/Extension.ts`.
- `redactUrl`/`collectEnvironment` (`src/admin/capture/collectEnvironment.ts`) — internal helpers, not re-exported; only consumed by `ReportBugPresenter`.
- Backend permission model: see security finding SEC-31 (private notes).

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | `packages/bug-reporter/src/admin/capture/collectEnvironment.ts` | Security finding SEC-22 — see private notes. | — | medium |
| 2 | medium | `packages/bug-reporter/src/admin/recording/ActionRecorder.ts` | Security finding SEC-23 — see private notes. | — | medium |
| 3 | medium | `packages/bug-reporter/src/api/readPayload.ts` | Security finding SEC-31 — see private notes. | — | high |

## Duplication
None found — jscpd reports zero clones for this package (`jscpd-bug-reporter/jscpd-report.json`), and no cross-package reimplementation of lower-level utilities was found; the package correctly reuses `ApiStreamClient`/`readServerSentEvents` (`@webiny/app`), `HttpRouteHandler`/`toSseFrame` (`@webiny/event-handler-core`), and `IdentityContext`/`BuildParams` (`@webiny/api-core`) rather than rolling its own SSE, routing, or identity/config plumbing.

## Dead code
None found. Every exported symbol checked (`BugReportMount`, `ReportBugCommand`, `BugReportFeature`, `SubmitBugReportRouteDefinition`) has at least one caller confirmed via codegraph, all within the package's own `Extension.tsx` files, which is expected for a self-contained extension package.

## Convention issues
- Backend route authorization: see security finding SEC-31 (private notes).
- No other DI-naming, one-per-file, inline-type, or barrel-export violations were found; the package consistently follows the abstraction/implementation/`feature.ts` split described in AGENTS.md.

## Test gaps
- `ActionRecorder` (`src/admin/recording/ActionRecorder.ts`) has no dedicated test file; its click/input/network/console/exception watchers and the 150-event ring-buffer eviction are exercised only indirectly (if at all) through other tests.
- `GitHubIssueGateway` (`src/api/github/GitHubIssueGateway.ts`) has no test file — the assets-branch creation race handling (422-on-create-race), the tool-label check-then-create, and the screenshot path/extension logic are untested.
- `ReportBugPresenter` (`src/admin/presentation/report/ReportBugPresenter.ts`) has no test file — the abort/close-mid-submission race guard (`this.controller === controller` check) and the popup-blocked fallback path (`openCompose`) are untested.
- Security finding SEC-31 has no regression test (see private notes).

## Recommendations
1. Address security finding SEC-31 (see private notes).
2. Address the security-sensitive findings tracked privately (see Bugs #1–2 and the private security notes).
3. Add test coverage for `ActionRecorder` and `GitHubIssueGateway`, the two pieces that do the actual data collection and the actual write to a third-party service, and are currently the least tested parts of the package.
