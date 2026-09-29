# @webiny/app-mailer

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/app-mailer` is a small admin-app extension that adds a single "Mailer Settings" screen (menu item + route, gated by a `mailer.settings` permission) for viewing and editing SMTP transport settings, built on `app-admin`'s DI-feature (`GetSettings`/`SaveSettings`) and form-model (`FormModelFactory`) conventions. The code is thin and consistent with the repo's Gateway/Repository/UseCase/Presenter pattern; there are no bugs of note and jscpd found zero duplication. The SMTP password field is handled correctly from a security standpoint: `GetMailerSettings` never requests/returns the password, the form's password field always starts empty, and `save()` only includes `payload.password` when the user actually typed a new value, so an unmodified password is never round-tripped through the UI. The package has no automated tests, and one small piece of internal state (`GetSettingsRepository.settings`) is written but never read.

## Public API
- `Extension` (`src/Extension.tsx`, re-exported from `src/index.tsx`) — registers the three DI features and mounts the settings route/menu entry; this is the sole export, consumed by the admin app project layer that assembles `app-*` extensions (outside this package, not verified further per the cost rules).
- `Routes.Settings` (`src/routes.ts`) — the route descriptor, used only internally (`Extension.tsx`, `SettingsView.tsx` navigation).
- `MailerSettings`/`TransportSettings`/`MailerSettingsSource` types (`src/types.ts`) — internal shapes shared by the `getSettings`/`saveSettings` features and the settings presenter; not re-exported for external consumption.

## Bugs
None found. The save/load round-trip (`GetSettingsRepository` ↔ `SaveSettingsUseCase.execute` → `settingsRepository.updateSettings`) is internally consistent, and error handling in both gateways (`throw new Error(error.message)`) is caught by `SettingsView.handleSave`'s try/catch and surfaced via `toast.showWarningToast`.

## Duplication
None within the package (jscpd reports zero clones/duplicated lines for `app-mailer`). `GetSettingsGateway.ts`/`SaveSettingsGateway.ts` and their abstractions follow the same thin Gateway/Repository/UseCase triad used by `app-audit-logs`'s `listAuditLogs` feature and dozens of other `app-*` features; no reimplementation of lower-level utilities was found (the form itself is built via `app-admin`'s `FormModelFactory`, not hand-rolled).

## Dead code
- `GetSettingsRepository.settings` (`src/features/getSettings/GetSettingsRepository.ts:9`) is a public observable field, written by both `execute()` and `updateSettings()`, but nothing in `app-mailer` ever reads `.settings` (grep across `src/` shows no read site, and `SettingsPresenter` keeps its own local `source`/`form` state instead of consuming this cache). It's effectively write-only state; either something outside the package was meant to observe it reactively (worth checking with the settings screen's original design intent) or it can be dropped from the `IGetSettingsRepository` interface.

## Convention issues
None found; abstraction/implementation/feature file layout, namespace-typed interfaces (`GetSettingsGateway.Interface`, etc.), and barrel exports (`index.tsx` only exposing `Extension`) all match the conventions established elsewhere in `app-admin`/`app-audit-logs`.

## Test gaps
- No test files exist under `packages/app-mailer` at all. Untested behavior of note: `SettingsPresenterImpl.buildForm`'s `isCodeManaged` branch (disabling all fields and hiding the password row when `source === "code"`), and `save()`'s conditional inclusion of `payload.password` (the one piece of logic that specifically protects the password field from being blanked out on an unrelated settings change).

## Recommendations
1. Add at least a couple of unit tests for `SettingsPresenterImpl.save()`/`buildForm()`, since the password-omission logic (`if (data.password) { payload.password = ... }`) is exactly the kind of one-line conditional that regresses silently and has security relevance if it's ever inverted or dropped.
2. Decide whether `GetSettingsRepository.settings`/`updateSettings` should be consumed reactively (e.g. by the presenter, to avoid divergence between the cached repository state and the presenter's own `form`/`source` fields) or removed from the interface if it was leftover scaffolding.
3. No urgent action needed beyond the above two; the package is small and low-risk as-is.
