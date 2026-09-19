---
name: webiny-admin-menu
description: >
  Adding an item to the Webiny admin's left sidebar: a top-level entry, or one nested under an
  existing group such as Settings or Dev Tools. Use this when a page needs to be reachable from the
  navigation. Covers AdminConfig.Menu, placement and ordering, and the existing parent groups.
context: webiny-extensions
---

<!-- GENERATED FILE. Do not edit. Authored in skills/shared/extensions/menu.md; run `yarn generate-skills`. -->

## What a menu entry is

One item in the admin's left sidebar. It is configuration, not a component: a name, the text to
show, where it links, and optionally which group it sits under.

The `name` is an identifier, not a label. It has to be unique across the whole sidebar, because it
is also what other extensions use to place themselves relative to this one, and what `parent`
refers to when something nests under it.

## Placement

`parent` nests the item under an existing group. Omit it for a top-level entry. The groups that
exist by default are:

- `settings` and its subgroups `settings.system` and `settings.security`
- `headlessCMS`
- `wb` (Website Builder)
- `dev-tools`

Nesting under a group that does not exist gives you an item nobody can see, and nothing reports it,
so use one of the above or leave it top level.

`pinnable` lets a user pin the item to the top of their sidebar. Most navigable destinations should
set it; a group heading should not.

## What a menu cannot do

It links to a route. It does not create one. If the path does not already resolve, the item appears
and leads to a blank page, which is the usual way a new menu entry looks broken.

## Adding one in your project

```tsx
// extensions/Reports/Extension.tsx
import React from "react";
import { AdminConfig } from "webiny/admin/configs";

const { Menu } = AdminConfig;

export const Extension = () => (
  <AdminConfig>
    <Menu
      name={"reports"}
      element={<Menu.Link text={"Reports"} to={"/reports"} pinnable={true} />}
    />
  </AdminConfig>
);
```

Nested under an existing group, with an icon:

```tsx
import { ReactComponent as ReportIcon } from "@webiny/icons/bar_chart.svg";

<Menu
  name={"reports"}
  parent={"settings.system"}
  element={
    <Menu.Link text={"Reports"} to={"/reports"} pinnable={true}>
      <Menu.Link.Icon icon={<ReportIcon />} />
    </Menu.Link>
  }
/>;
```

Ordering is controlled with `before`, `after` and `pin`. `pin={"start"}` and `pin={"end"}` place the
item first or last among its siblings; `before` and `after` take another menu's `name`.

Setting `remove` on a `Menu` with an existing `name` takes that item out of the sidebar, which is
how you hide a built-in entry rather than trying to override it.

Reference the extension from `webiny.config.tsx`, with the full path including the `.tsx` extension:

```tsx
<Admin.Extension src={"/extensions/Reports/Extension.tsx"} />
```
