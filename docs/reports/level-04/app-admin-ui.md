# @webiny/app-admin-ui

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/app-admin-ui` is the concrete "skin" for `@webiny/app-admin`'s slot/renderer system: it plugs `Layout`, `Navigation` (sidebar), `Breadcrumbs`, `UserMenu`, `Dialog`, `NotFound`, `Dashboard` (+ two dashboard widgets), and a rich `CommandPalette` (with an "Ask AI" mode built on `AdminAssistantFeature`) into the renderer slots exposed by `app-admin`, `admin-ui`, and `icons`. Architecturally it is thin and well-behaved: nearly every top-level file is a `XxxRenderer.createDecorator(...)` wrapper around an `admin-ui` primitive, it consumes `useAdminConfig`/`useFeature`/`useContainer` rather than reimplementing any DI or config machinery, and the `CommandPalette`'s mode abstraction (`PaletteMode`, `createAiMode`) is a clean, well-commented extension point. Overall health is good — no critical bugs, no code duplication (jscpd found zero clones) — but there is a confirmed display bug in the user-menu name fallback, a dead dashboard widget that's exported but never wired in, and this whole package (~45 source files) has no test coverage at all.

## Public API
- `AdminUI` (`index.tsx`) — the single composition root that mounts every renderer decorator (`Dashboard`, `Dialog`, `Layout`, `Navigation`, `NotFound`, `UserMenu`, `Logo`) and registers the two built-in dashboard widgets; consumed once, at the admin app's bootstrap (outside this package).
- `Layout` / `Navigation` / `Breadcrumbs` / `UserMenu*` / `Dialog` / `NotFound` / `Dashboard` / `Logo` — decorators registered against `app-admin`'s renderer slots (`LayoutRenderer`, `NavigationRenderer`, etc.); these are Webiny's default implementations and are not expected to be imported directly by other packages (codegraph shows no cross-package imports of this package's exports besides the bootstrap wiring).
- `CommandPalette` (`CommandPalette/CommandPalette.tsx`) — mounted from `Layout.tsx`; reads `CommandPaletteFeature` and `AdminAssistantFeature` (both defined in `app-admin`), and is the package's most substantial piece of original logic (mode switching, hotkeys, AI conversation UI).

## Bugs
| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | low | packages/app-admin-ui/src/UserMenu/UserMenuHandle.tsx:15-21 | `const { firstName, lastName, avatar } = profile || {}` then `fullName = \`${firstName} ${lastName}\`` falls back to `identity.displayName` only when `fullName.trim() === ""`. But the frontend `IProfile` type (`packages/app-admin/src/domain/Identity.ts:21-29`) declares `firstName?: string` and `lastName?: string` as genuinely optional/absent (not defaulted to `""` the way the backend's `IdentityProfile` getters are), so a profile with no name set yields `firstName`/`lastName` of `undefined` (or `null` from GraphQL). | For an authenticated identity whose profile has no first/last name recorded, the avatar's initial and header both show the literal string "undefined undefined" (or "null null") instead of falling back to `identity.displayName` as intended; `fullName[0]` (line "uppercase" avatar fallback) then also renders the wrong character. | high |

## Duplication
None found. jscpd reports zero clones for this package (only three tiny unrelated SVG assets and no JS/TS duplication above threshold).

## Dead code
- `MissingPermissionsWidget` (`packages/app-admin-ui/src/Dashboard/components/MissingPermissionsWidget.tsx`) — exported from `Dashboard/components/index.ts` but never imported anywhere else in the source tree (grep across `packages/` finds only its own definition and the barrel re-export); unlike its siblings `AssistanceWidget`/`CommunityWidget`, it is not registered as an `AdminConfig.Dashboard.Widget` in `index.tsx`, so it renders nowhere in the shipped admin app.

## Convention issues
None of real significance — the package consistently uses the `XxxRenderer.createDecorator()` slot pattern, keeps one component per file, and the `CommandPalette` mode split (`PaletteMode` interface + `createAiMode` implementation) matches the project's abstraction/implementation convention even though this isn't a formal DI feature. The one minor barrel-export nit is the dead `MissingPermissionsWidget` export noted above.

## Test gaps
The package has no `__tests__` directory and no `*.test.*` files at all. The highest-value untested logic, given it's pure and non-trivial: `CommandPalette/deriveRows.tsx` (`formatShortcut`, `deriveNavigationRows`'s section/icon inheritance and depth-guarded ancestor walk, `commandVmsToGroups`' category grouping), `CommandPalette/modes/createAiMode.tsx`'s `handleKey`/`toolState`-adjacent logic, and `Breadcrumbs.tsx`'s "hold the last trail while navigating" state machine — all are easy to unit test in isolation (no DOM needed for the `deriveRows` functions) and currently have zero coverage.

## Recommendations
1. Fix the user-menu name fallback in `UserMenuHandle.tsx` to check `firstName`/`lastName` for presence (e.g. `[firstName, lastName].filter(Boolean).join(" ")`) rather than relying on `.trim() === ""` against a template literal that can legitimately contain the literal words "undefined"/"null".
2. Either wire `MissingPermissionsWidget` into `AdminConfig.Dashboard.Widget` (if it was meant to ship) or delete it along with its barrel export.
3. Add unit tests for the pure logic in `CommandPalette/deriveRows.tsx` and the `PaletteMode`/`createAiMode` state transitions, since this is the package's only non-trivial original logic and it currently has zero test coverage.
