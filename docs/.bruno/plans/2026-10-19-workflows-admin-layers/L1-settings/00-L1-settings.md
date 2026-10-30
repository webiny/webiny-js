# Workflows admin layers L1: Settings

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Read first:** `../00-shared.md`: Global Constraints, Review Focus, Rulings R342-R364, Assumptions A113-A117, Task order, and the Interfaces by task entries for Tasks 1 and 2 (and Task 3's, which consumes `toOperationError` at its new path). Binding here: R342 (no behaviour change), R343 (layers), R344 (names and layout), R345 (`GetSettingsParams` stays in `IWorkflowSettingsGateway.ts`), R346 (errors), R348 rows 1-2, R351 (`includeExpired: true` in the use case, mapping in the repository), R352 (the three settings rows), R354 (`WorkflowSettingsServicesFeature` without `resolve`), R355 (tests), R356 (the settings bridge), R358 (what Task 14 deletes), R360 (throw contract comments). Also the inherited Global Constraints (9c, 9b, 9a, 8b, 8a) and 8a R202, R204, R234, R238, R243; 9c R317-R327 (the settings behaviour the tests pin). User answers Q69-Q76 (`../00-answers.md`).

**Goal:** The settings area of `packages/app-workflows` follows presenter → use case → repository → gateway. The shared error helper moves to `src/gateway/`. `WorkflowSettingsGateway` throws `GraphQLOperationError` instead of returning envelopes. `WorkflowSettingsRepository` maps DTO ↔ domain. `GetWorkflowSettingsUseCase` and `UpdateWorkflowSettingsUseCase` replace the two methods of the `WorkflowSettingsUseCases` bundle. The three settings presenters inject exactly the use case each one calls. The bundle stays only as an unused delegate until the cleanup (Task 14). Users see no change.

**Depends on:** nothing in this plan (the contract commit `d31d2bcd08` and the file renames before it). Task 3 (L2) consumes `toOperationError` at `[AW]/gateway/`. Task 4 replaces the `config` fake in the settings test kits and the `WorkflowConfigUseCases` dependency of the two settings presenters that look up users.

## Tasks

| # | File | Title | Produces for later tasks |
|---|---|---|---|
| 1 | `task-01-settings-data-layer.md` | Error helper and settings data layer | `toOperationError` at `~/gateway/toOperationError.js` (Tasks 3, 5, 7, 8); `IWorkflowSettingsGateway` returning DTOs; `WorkflowSettingsRepository`, `WorkflowSettingsRepositoryFeature`; `GetWorkflowSettingsUseCase`, `GetWorkflowSettingsFeature`; `UpdateWorkflowSettingsUseCase`, `UpdateWorkflowSettingsFeature`; `WorkflowSettingsServicesFeature` without `resolve`; the `WorkflowSettingsUseCases` bridge (deleted by Task 14) |
| 2 | `task-02-settings-presenters.md` | Settings presenters inject their use cases | the R352 settings rows (`ExclusionsPagePresenter` `[GetWorkflowSettingsUseCase, WorkflowConfigUseCases]`, `ExclusionDialogPresenter` `[UpdateWorkflowSettingsUseCase, WorkflowConfigUseCases, WorkflowEditorToasts]`, `RemoveExclusionDialogPresenter` `[UpdateWorkflowSettingsUseCase, WorkflowEditorToasts]`); the rewritten kits `createExclusionsPageSetup` (`getWorkflowSettings`, `config`) and `createExclusionDialogSetup` (`updateWorkflowSettings`, `config`, `toasts`), which Task 4 extends |

## Review Focus for this sub-phase

- **Review Focus 1 (errors), settings part.** `WorkflowSettingsGateway.test.ts` pins both operations. An error envelope becomes a `GraphQLOperationError` with the server's `code`, `message` and `data`. An error without a message gets `The request failed.`. An envelope with neither data nor error gets the fallback with `code` and `data` `null`. A transport `Error` passes as the same instance. The use-case tests prove that the repository and use cases pass both kinds of error through unchanged (`rejects.toBe`).
- **R317 / R351.** `GetWorkflowSettingsUseCase` always sends `{ includeExpired: true }`. The gateway passes the flag through as given (`false` too). The repository maps absent values to `null` in the server's order and sends a save's list exactly, nulls kept.
- **Review Focus 6 (feature flag).** `[AW]/app.test.tsx` resolves the gateway and the repository (singletons) and the two use cases (transient) with the flag on, and every resolve throws with it off. The bridge assertions stay. `[AWS]/feature.test.ts` proves the same on the bare feature. `app.cleanup.test.tsx` keeps `gateway`.
- **Review Focus 8 (inject exactly what is called), settings part.** Each presenter's `dependencies` equals its R352 row. The kits register exactly those tokens. No kit or test exposes an object with several operations. After Task 2, a grep finds `WorkflowSettingsUseCases` only in the bridge, its registration, its root assertions and its fake.
- **Behaviour unchanged (R342).** No document, variable or field selection changes (the gateway test asserts them). No copy, VM or presenter test assertion changes, only the fake access does. The presenters' error handling (`instanceof GraphQLOperationError`, `code`) is untouched.
- **Naming (Q76, R344).** No `Impl` or `Abstraction` suffix on an exported name or a file name. Only the abstraction is aliased (`as UseCaseAbstraction`, `as RepositoryAbstraction`, `as GatewayAbstraction`). Tokens are `Workflows/WorkflowSettingsRepository`, `Workflows/GetWorkflowSettingsUseCase` and `Workflows/UpdateWorkflowSettingsUseCase`. Features are `Workflows/GetWorkflowSettings` and `Workflows/UpdateWorkflowSettings`. There is no `index.ts`.

## Done when

Both tasks are reviewed clean and committed, one commit each (`refactor(app-workflows): ...`, with the two trailer lines). The following hold:
- `toOperationError` and its test live in `packages/app-workflows/src/gateway/`, and nothing imports `editor/useCases/toOperationError`.
- `WorkflowSettingsGateway` throws per R346, and its test covers documents, variables, unwrapping, error with code and data, fallback, missing data and transport.
- `WorkflowSettingsRepository` and the two use cases exist in the R344 layout, each use case with its own `feature.ts` and test.
- `WorkflowSettingsUseCases.test.ts` is deleted, and its cases are ported.
- `WorkflowSettingsServicesFeature` has no `resolve`.
- The three settings presenters inject their R352 rows, and every settings presenter, component and mounting test passes with unchanged behaviour assertions.
- `yarn check:test:types -p app-workflows --report cli` and `yarn build -p @webiny/app-workflows --no-cache` are clean. No file outside `packages/app-workflows` changes.

Stop for the user.
