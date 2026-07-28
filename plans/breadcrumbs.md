# Breadcrumbs for Webiny Admin

Design source: Figma "Webiny UI" — Header bar node `2047-22464`
(https://www.figma.com/design/4XsQ9YFfV1xVbLEvmJ3JDX/Webiny-UI?node-id=2047-22464&m=dev).

A breadcrumb trail in the admin header bar: `home › ancestor › … › current`. Ancestors are
navigable; the current (last) item is not.

## Architecture — React Config API (not DI)

Breadcrumbs are **pure presentation**, so they compose through the same React Config API as
`AdminConfig.Menu` / `Dashboard.Widget` — **not** dependency injection. (An earlier DI
`Breadcrumb` abstraction was built and removed: DI is overkill for presentation and, being
root-resolved + synchronous, couldn't produce dynamic labels — folder path, model name,
`page.title` — which was the whole wall. Feedback from Pavel confirmed the Config API is the
right fit.)

- **`AdminConfig.Breadcrumb`** (`packages/app-admin/src/config/AdminConfig/Breadcrumbs.tsx`) —
  a config component mirroring `Widget.tsx`. Each mounted `<Breadcrumb name label to? icon?/>`
  appends an item to the `breadcrumbs` array property. `to` is `string | { route, params }`.
- **`useAdminConfig().breadcrumbs`** — the assembled trail, in mount order. Added to the
  `AdminConfig` interface + `useAdminConfig()` return.
- **Header** (`packages/app-admin-ui/src/Breadcrumbs/Breadcrumbs.tsx`) — reads
  `useAdminConfig().breadcrumbs`, prepends the home entry (→ `/`), resolves `to` via the
  router (`RouterPresenter.getLink` for `Route`s), marks the last item current, and renders
  the DS primitive. Re-renders as views mount/unmount their `<Breadcrumb>`s. Mounted in
  `Layout.tsx`, `HeaderBar` `start` slot.
- **DS primitive** (`packages/admin-ui/src/Breadcrumbs/Breadcrumbs.tsx`) — presentational
  `Breadcrumbs` (Figma node 2047-22464) + `createHomeBreadcrumbItem` + Storybook story.

## Usage

Static trail — declare at the route (or anywhere in the view), no view logic needed:

```tsx
<AdminConfig>
  <AdminConfig.Breadcrumb name="settings" label="Settings" />
  <AdminConfig.Breadcrumb name="mailer" label="Mailer" />
</AdminConfig>
```

Dynamic trail — a plain `observer` component that renders a `<Breadcrumb>` per item from live
view state:

```tsx
<Breadcrumb name="fm-root" label="File Manager" to={{ route: Routes.List }} />;
{
  folderPath.map(f => (
    <Breadcrumb
      key={f.id}
      name={f.id}
      label={f.title}
      to={{ route: Routes.List, params: { folderId: f.id } }}
    />
  ));
}
```

The header always prepends home and marks the last mounted item as current (non-clickable).

## Reference adoptions

- **Mailer (static)** — two `<AdminConfig.Breadcrumb>`s at the route in `Extension.tsx` →
  `Home › Settings › Mailer`. View untouched.
- **File Manager (dynamic)** —
  `packages/app-file-manager/src/presentation/FileManager/FileManagerBreadcrumbs.tsx`, an
  `observer` that emits the folder path (`getAncestorIds`, reversed) as `<Breadcrumb>`s.
  Mounted in `FileManagerView` **page mode only** (`!overlayConfig`) — the overlay picker has
  no admin header. Navigation flows through the `folderId` param + `RouteParamsSync`.

## Status

- Config plumbing, header, DS primitive: done. All packages typecheck; lint + format clean.
- DI `Breadcrumb` abstraction + presenter + every per-module `*Breadcrumb.ts`/feature:
  **removed**.

## Still open

- **Re-adopt the remaining apps** with `<Breadcrumb>` (Audit Logs, GraphQL/SDK Playground,
  Workflows, Website Builder, Access Management, Users, Webhooks, Background Tasks, AI
  Power-Ups, CMS models/groups/entries + workflows). Removed with the DI sweep; only Mailer +
  File Manager re-adopted so far.
- Editors (CMS model, WB page) are full-screen — no shared header, skip.
- Overflow (`…`) shortcut for deep trails.
- Automated tests.
