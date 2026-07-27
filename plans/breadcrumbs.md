# Breadcrumbs for Webiny Admin

Design source: Figma "Webiny UI" — Header bar node `2047-22464`
(https://www.figma.com/design/4XsQ9YFfV1xVbLEvmJ3JDX/Webiny-UI?node-id=2047-22464&m=dev).

A breadcrumb trail in the admin header bar: `home › ancestor › … › current`. Shows the
user's location within a hierarchy; ancestors are navigable, the current (last) item is not.

## Decisions (locked)

- **Architecture:** DI-backed, mirroring the command palette (PR #5432). A MobX
  `BreadcrumbsPresenter` (DI abstraction + `createFeature`) holds the trail state; a
  **declarative React config layer sits on top** of it (`useBreadcrumbs` hook +
  `<Breadcrumbs>` / `<Breadcrumbs.Item>`). The presenter is the decoratable seam.
- **Scope v1:** the mechanism only — DS primitive + DI presenter + React API + header
  wiring. Populating real trails per module (CMS, Page Builder, File Manager, Settings …)
  is a **follow-up owned by each module**, same rollout the palette used.
- **UI:** new `Breadcrumbs` primitive in `@webiny/admin-ui` (none existed). Mounted in the
  header bar's `start` slot.
- **Overflow (`…` shortcut) deferred.** Design supports collapsing deep trails; v1 renders
  the full trail with per-item truncation (`max-w-[150px]`).

## Grounding (what already exists)

| Concern                    | Location                                                             | Notes                                                                         |
| -------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Palette DI pattern to copy | `packages/app-admin/src/presentation/commandPalette/`                | `abstractions.ts` + MobX presenter + `feature.ts`; registered in `Admin.tsx`. |
| Header bar (mount point)   | `packages/admin-ui/src/HeaderBar/HeaderBar.tsx`                      | `start`/`middle`/`end` slots. Breadcrumbs go in `start`.                      |
| Layout composition         | `packages/app-admin-ui/src/Layout.tsx`                               | Renders `HeaderBar` with `start={startElement}`. Palette also mounts here.    |
| Reactive (MobX) UI wrapper | `createReactiveComponent` (`@webiny/app-admin`)                      | Palette UI uses it; breadcrumbs UI does too.                                  |
| Router                     | `RouterGateway` (`@webiny/app/features/router/abstractions.js`)      | `pushState(to)` for item navigation. Home → `/`.                              |
| Icons                      | `@webiny/icons/home.svg`, `@webiny/icons/keyboard_arrow_right.svg`   | Material glyphs; `fill` defaults to `currentColor`.                           |
| DI factory semantics       | `@webiny/di` `registerFactory` runs the factory **on every resolve** | Not memoized — see the singleton note below.                                  |

## Architecture

### DS primitive — `@webiny/admin-ui/src/Breadcrumbs/`

Presentational, props-driven (like `EmptyState`). `Breadcrumbs` takes `items: BreadcrumbsItem[]`:

```ts
interface BreadcrumbsItem {
  label?: string; // omitted for the icon-only home item
  icon?: React.ReactNode; // raw glyph; sized + colored by the breadcrumb
  title?: string; // native tooltip; defaults to label
  onClick?: () => void; // navigable when present and not current
  current?: boolean; // the last item; stronger text, never interactive
}
```

- Home = icon-only, muted, clickable. Separator = `keyboard_arrow_right`, `aria-hidden`.
  Intermediate = `text-neutral-muted` + hover; current = `text-neutral-primary`.
- Text `text-sm` (12px). Glyphs rendered raw with `size-md fill-current` (DS `Icon` has no
  `neutral-muted` color variant), so the item's text color drives the icon.
- `createHomeBreadcrumbItem(onClick)` helper for the leading entry.
- `makeDecoratable("Breadcrumbs", …)`.

### DI core — `@webiny/app-admin/src/presentation/breadcrumbs/`

- `abstractions.ts`: `BreadcrumbTrailItem` (`{ id?, label, icon?, to?, title? }`),
  `BreadcrumbsPresenter` abstraction (`vm`, `setTrail`, `clear`).
- `BreadcrumbsPresenter.ts`: MobX `makeAutoObservable`, holds `items`.
- `feature.ts`: `createFeature` → **memoizes a single presenter in the factory closure**.
  Rationale: breadcrumbs have two consumers — the view that writes the trail and the header
  that reads it. `registerFactory` isn't memoized by the container, so without the closure
  singleton the reader and writer would get different instances and writes would never show.
- Registered in `Admin.tsx` next to `CommandPaletteFeature`; exported from the barrel.

### React config layer (on top of the DI presenter)

- `useBreadcrumbs(items)`: resolves the feature, sets the trail on mount / when items
  change (serialized signature dep so inline arrays are safe; icons excluded), clears on
  unmount.
- `<Breadcrumbs>` + `<Breadcrumbs.Item label to icon title>`: declarative sugar that reads
  its children's props and calls `useBreadcrumbs`. Renders nothing.

### Header UI — `@webiny/app-admin-ui/src/Breadcrumbs/Breadcrumbs.tsx`

- `createReactiveComponent` observing `BreadcrumbsPresenter`.
- Prepends the home item (→ `/`), maps trail items to DS `BreadcrumbsItem` (last = `current`,
  others navigate via `RouterGateway.pushState(to)`).
- Mounted in `Layout.tsx` inside `HeaderBar` `start`, before `startElement`.

## Usage (for module authors)

```tsx
import { Breadcrumbs } from "@webiny/app-admin";

// inside a view:
<Breadcrumbs>
  <Breadcrumbs.Item label="Page Builder" to={pbListRoute} />
  <Breadcrumbs.Item label="Articles" />
</Breadcrumbs>;

// or imperatively:
useBreadcrumbs([{ label: "Page Builder", to: pbListRoute }, { label: "Articles" }]);
```

## Status (implemented)

- DS primitive (+ Storybook story), DI presenter + feature, React config (hook +
  components), header wiring.
- `@webiny/admin-ui`, `@webiny/app-admin`, `@webiny/app-admin-ui` all build (TS clean);
  lint + format clean.
- No module trails populated yet (per scope). Nothing committed or pushed.

## Reference adoption — File Manager

`packages/app-file-manager/src/presentation/FileManager/FileManagerBreadcrumbs.tsx`
publishes the folder path (`Home › File Manager › Marketing › Demo`). Mounted in
`FileManagerView` **page mode only** (`!overlayConfig`, beside `RouteParamsSync`) — the
overlay file picker has no admin header. Trail built from the folder-tree VM
(`getAncestorIds`, reversed to root→current) with `to = getLink(Routes.List, { folderId })`;
`RouteParamsSync` mirrors the `folderId` param back into the tree selection. The DI presenter
is registered on the root container, and the FM child container resolves it via parent
delegation.

Caveat: deep-linking straight to a nested `folderId` can render a partial trail until the
ancestor folders are in the cache (`getAncestorIds` stops at the first missing ancestor).

## Still open

- **Per-module adoption** — remaining modules (CMS / Page Builder / Settings). File Manager
  done (above) as the reference.
- **Overflow (`…`) shortcut** for deep hierarchies.
- **Unmount ordering caveat:** `useBreadcrumbs` clears on unmount. On a route swap the
  outgoing view's cleanup and the incoming view's `setTrail` both run in the same commit
  (cleanup first), so the final trail is correct; a one-frame stale trail is possible in
  edge cases. Revisit if it shows in practice (e.g. only clear if we were the last writer).
- **Automated tests.**
