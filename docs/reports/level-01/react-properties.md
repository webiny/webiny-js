# @webiny/react-properties

> Level 1 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`react-properties` is the framework behind Webiny's "code-defined configuration" pattern: `<Property>` components register (name, value, parent, ordering) tuples into a per-`<Properties>` `PropertyStore` during mount/render, which are debounced, ordered (by explicit `before`/`after` placement or numeric priority), and flattened into a plain JS object via `toObject`/`useConfig`. `createConfigurableComponent` builds the higher-level `<Config>`/`useConfig` pair used by consumers, and `AsyncProperties`/`Await` add async-fetch support that gates output until pending awaits settle. It is widely used (~40 directories across `app-admin`, `app-aco`, `app-file-manager`, `app-headless-cms`, `app-website-builder`, `project`, `cognito`, etc.), well tested for its core ordering/merge/async paths, and generally careful (e.g. explicit comments about StrictMode/re-render pitfalls). The one real gap is that the `replace` prop silently drops any `before`/`after` positioning passed alongside it, which is a live foot-gun for the two components (`Color`, `Typography`) that already expose both props together.

## Public API
- `Properties`, `Property`, `ConnectToProperties`, `useProperties`/`useMaybeProperties`, `useAncestorByName`, `useAncestor`, `useParentProperty` (packages/react-properties/src/Properties.tsx) — the low-level primitives; consumed indirectly by nearly every config-driven UI package (~40 directories, e.g. `app-admin/src/config/AdminConfig`, `app-headless-cms/src/admin/config`, `app-website-builder`).
- `createConfigurableComponent` → `{ WithConfig, Config, useConfig }` (packages/react-properties/src/createConfigurableComponent.tsx:50) — the pattern most feature packages actually use to define a typed config surface (e.g. `app-admin`'s `AdminConfig`, `app-website-builder`'s `BaseEditor` config, `app-aco`'s folder/record configs).
- `AsyncProperties`, `useAsyncProperties`, `Await` (AsyncProperties.tsx, Await.tsx) — used by `packages/cognito/src/Cognito.tsx`, `packages/project/src/services/GetProjectConfigService/renderExtensions.tsx`, `packages/app-website-builder/.../Preview.tsx` to let config resolution wait on async data before flushing.
- `toObject`, `getUniqueId` (utils.ts), `useIdGenerator` (useIdGenerator.ts), `DevToolsSection` (dev-only Chrome extension panel).
- `PropertyStore` (domain/index.ts) is also re-exported from the package root, but see Convention issues — it has no external consumers.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | medium | packages/react-properties/src/Properties.tsx:232-235 and src/domain/PropertyStore.ts:100-105,205-215 | When a `<Property>` is given both `replace` and `before`/`after`, the mount effect takes the `replace` branch and returns immediately (`if (replace) { replaceProperty(replace, property); return; }`) without ever calling `addProperty(..., { after, before, priority })`. `PropertyStore.replaceProperty`/`executeReplace` also have no `options` parameter at all, so there is no code path that can apply positioning during a replace. | `packages/app-admin/src/config/AdminConfig/LexicalTheme/Color.tsx` and `.../Typography.tsx` both expose `replace`, `after`, and `before` props on the same component and forward all three to `<Property>`. Any future call site that passes `replace` together with `before`/`after` (e.g. "replace this color and move it to the end") will have the position silently ignored — the replacement keeps the exact array slot of the property it replaced, with no error or warning. No current in-repo caller combines the two props, so it hasn't manifested yet, but the public component API actively advertises the unsupported combination. | high |
| 2 | low | packages/react-properties/src/domain/PropertyStore.ts:205-215 | `executeReplace` never removes the old id from the `priorities` and `positioned` maps (contrast with `executeRemove` at lines 192-194, which explicitly clears both), and it never adds the new id to `positioned` even if the property being replaced was explicitly positioned via `before`/`after`. | Stale `priorities`/`positioned` entries accumulate for every id ever passed as a `replace` target for the lifetime of the store (a `Properties` subtree that lives a long time, e.g. an editor session with many replace operations, leaks small Map entries). Functionally low-impact since `order.sort()` only consults these maps for ids still present in `order`, but it's a real, unbounded leak and a latent trap if `executeReplace` is ever extended to reuse these maps. | high |

## Duplication
No internal clones (jscpd: 0 duplicated lines across all 15 source files). `getWcpOrgProjectId`-style duplication seen in other audited packages is not present here; the debounce/ordering logic in `PropertyStore` is distinct from `@webiny/react-composition`'s HOC-registration store (different data model — ordered/prioritized flat list vs. keyed decorator chains), so there's no meaningful overlap with that dependency either.

## Dead code
None found for the documented public API surface — every export in `src/index.ts` has at least one in-repo consumer, except `PropertyStore` itself (see Convention issues, not "dead" since it's used internally, just unnecessarily public).

## Convention issues
`PropertyStore` (packages/react-properties/src/domain/PropertyStore.ts) is re-exported all the way through `domain/index.ts` → the package root `index.ts:8` (`export * from "./domain/index.js"`), making an internal, mutable implementation class part of the public API even though nothing outside the package imports it (confirmed via repo-wide grep — only internal usages in `Properties.tsx`/`AsyncProperties.tsx` and a code comment in `app-admin` reference it). This runs against the "minimal barrel exports — only export what external consumers need" convention; consumers should only need the hook/component surface (`Properties`, `Property`, `createConfigurableComponent`, etc.), not the store class itself.

## Test gaps
The `replace` + `before`/`after` combination (Bug #1) has no test — `properties.test.tsx`'s "should replace existing property with a new one" test only replaces a non-positioned property, so the dropped-positioning behavior is unverified either way. There's also no test for `PropertyStore`'s Map cleanup on replace (Bug #2). Otherwise, coverage for ordering, priority merging, StrictMode-safe registration, and async gating (`await.test.tsx`) is solid.

## Recommendations
1. Fix `replace` to also honor `before`/`after`/`priority`: thread `options` through `replaceProperty`/`executeReplace` (and carry over the old id's `positioned` status when no new options are given), so `Color`/`Typography`'s advertised prop combination behaves as documented.
2. Add a test exercising `replace` together with `before`/`after` to lock in the intended semantics once fixed.
3. Stop re-exporting `PropertyStore` from the package root; keep it as an internal-only type/class (already unused externally) to match the repo's minimal-barrel-export convention.
