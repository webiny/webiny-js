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

## Adoptions

Every Route-based admin page now declares its trail. Two shapes:

**Static** — `<AdminConfig.Breadcrumb>` at the route (no view logic): Mailer, Audit Logs,
GraphQL/SDK Playground, Workflows, Access Management (Roles/Teams/API Keys), Users/Account,
Webhooks, Background Tasks, AI Power-Ups, Website Builder Redirects, CMS Models/Model Groups,
CMS & WB workflow editors.

**Dynamic** — an `observer` component inside the scoped view that emits a `<Breadcrumb>` per
item from live state:

- **File Manager** — `FileManagerBreadcrumbs.tsx`, folder path. Page mode only
  (`!overlayConfig`).
- **CMS entries** — `ContentEntriesBreadcrumbs.tsx` → `Headless CMS › <Model> › <folders>`
  (model name + folder path from the scoped presenter). Static route crumbs removed.
- **Website Builder pages** — `WbPagesBreadcrumbs.tsx` → `Website Builder › Pages › <folders>`.
  Static route crumbs removed.

Navigation flows through route params (`folderId`, `modelId`) + `RouteParamsSync`.

## Status

- Config plumbing, header, DS primitive: done. All packages typecheck; lint + format clean.
- DI `Breadcrumb` abstraction + presenter + every per-module `*Breadcrumb.ts`/feature:
  **removed**.

## Still open

- Editors (CMS model, WB page) are full-screen — no shared header, skip.
- Overflow (`…`) shortcut for deep trails.
- Automated tests.

## Notes

- The `Cms/ContentEntries/WorkflowStateList` and `WebsiteBuilder/Pages/WorkflowStateList`
  routes in `routes.ts` are **dead** — no `Route` element / `getLink` references them, so
  there's no mounted page to add crumbs to. "Content reviews" renders inside the entries /
  pages list views (which already carry their trails).
