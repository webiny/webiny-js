---
name: webiny-admin-field-renderer
description: >
  Writing a custom field renderer for the Webiny admin: the component that draws one field in a
  form. Use this when a field needs to look or behave differently from the built-in renderers, for
  example a drag-to-reorder list, a colour-coded input, or a picker. Covers the field view model,
  the admin-ui components available, registering the renderer, and the traps that fail silently.
context: webiny-extensions
---

<!-- @shared -->

## What a field renderer is

A component that draws one field of a form. It is handed `{ field }`, a view model, and everything
it renders comes from that. It never owns the data; the form model does.

The view model is observable, so a renderer must be wrapped in `observer`. Without it the inputs
will not update as the user types, and nothing will report an error.

## Working with the field

Render the label. `field.label` is there, and a renderer that drops it leaves the form unreadable,
so use `FormComponentLabel` unless you are deliberately replacing it.

A single-value field: read `field.value`, write it with `field.onChange(next)`, and call
`field.onBlur()` on blur so validation runs when the form expects it.

A list of objects: `field.items`, `field.addItem()`, `field.moveItem(from, to)`, and `item.remove()`
per item. Reach a child with `item.fields.find(f => f.name === "<childName>")` and use its `.value`
and `.onChange`.

Never copy the field's data into local state. Call the model and let `observer` re-render. Local
state is what makes a renderer drift out of sync with the form.

`field.validation` is the RESULT of validation, `{ isValid, message }`, not the rules that produced
it. The field does not expose its configured validators at all, so a renderer cannot read a
`maxLength` or a pattern. If you need one, it is not available.

## Tree, for drag-and-drop ordering

`Tree` wraps `@minoru/react-dnd-treeview` but does NOT re-expose that library's props. Write it from
the signature in the type reference below, not from memory of that library.

- Pass `sort={false}`. Without it `Tree` sorts rows by label, which silently reorders a list whose
  order IS the data. Nothing throws and the stored data stays correct; only the screen disagrees
  with it. This is the single worst bug you can ship here, because it looks like it works.
- A node goes IN as `{ id, label, parentId, droppable, data: { ... } }`, with your own data nested
  under `data`.
- It comes back OUT flat: the renderer callback receives one object with the defaults and your data
  merged together, so it is `node.yourKey`, not `node.data.yourKey`.
- `id` and `parentId` are strings.
- In `onDrop`, work out the new order from the `newTree` argument (filter to your `rootId`, map to
  ids) rather than from a drop index.

<!-- @dev -->

## Writing one in your project

A renderer is an ordinary component. Import what you need.

```tsx
// extensions/MenuBuilder/MenuBuilderRenderer.tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { Input, IconButton, Icon, Text } from "webiny/admin/ui";
import { createObjectFieldRenderer } from "webiny/admin/form";

export const MenuBuilderRenderer = createObjectFieldRenderer(({ field }) => {
  return (
    <div>
      {field.items.map(item => {
        const label = item.fields.find(f => f.name === "label");
        return (
          <Input
            key={item.key}
            size={"md"}
            value={typeof label?.value === "string" ? label.value : ""}
            onChange={value => label?.onChange(value)}
          />
        );
      })}
    </div>
  );
});
```

Use `createFieldRenderer` for a single-value field and `createObjectFieldRenderer` for an object or
object list field.

## Registering it

Two registrations, and they do different jobs. One without the other gives you either a renderer
nothing can select, or an option that draws nothing.

`AdminConfig.Form.FieldRenderer` maps a name to a component when a form renders:

```tsx
// extensions/MenuBuilder/Extension.tsx
import React from "react";
import { AdminConfig } from "webiny/admin/configs";
import { MenuBuilderRenderer } from "./MenuBuilderRenderer.js";

export const Extension = () => (
  <AdminConfig>
    <AdminConfig.Form.FieldRenderer name={"menuBuilder"} component={MenuBuilderRenderer} />
  </AdminConfig>
);
```

`CmsFieldRenderer` is the catalogue the CMS field editor's Appearance tab offers. Without it, nobody
can pick your renderer for a field, because that dropdown is the only way to set a field's renderer
name. It is not exported through the `webiny` facade yet, so import it directly:

```tsx
import { CmsFieldRenderer } from "@webiny/app-headless-cms/presentation/fieldRenderers/abstractions.js";

class MenuBuilderCmsRenderer implements CmsFieldRenderer.Interface {
  rendererName = "menuBuilder"; // what gets stored on the field
  formRenderer = "menuBuilder"; // the AdminConfig name above; they may differ
  name = "Menu Builder"; // shown in the Appearance list
  description = "Drag-to-reorder menu items.";

  canUse({ field }) {
    return field.type === "object" && Boolean(field.list);
  }
}

export const MenuBuilderCmsRendererImpl = CmsFieldRenderer.createImplementation({
  implementation: MenuBuilderCmsRenderer,
  dependencies: []
});
```

Register that implementation in a feature and add the feature with `<RegisterFeature>`.

Then reference the extension from `webiny.config.tsx`. The `src` prop needs the full path including
the `.tsx` extension; omitting it fails the build.

```tsx
<Admin.Extension src={"/extensions/MenuBuilder/Extension.tsx"} />
```

`CmsFormModelBuilder` reads the renderer list once, so register at startup rather than later.

<!-- @admin -->

## The sandbox you are writing for

This renderer is stored and evaluated in the running admin. It is not compiled, not type-checked,
and cannot import anything. These constraints replace the ones a project file would have:

- NO import statements. Everything below is already in scope, by name.
- Declare the component as `const Renderer = ...`. That exact name is what gets loaded.
- No fetch, no direct DOM access, no globals beyond what is listed. Anything else fails to load.
- Use only the listed components, with exactly the props listed. React silently drops a prop it does
  not recognise, so a guessed prop name does not throw: you get a component that renders nothing, or
  one that ignores you. This is the most common way these fail.
- Props not listed for a component still work if the underlying DOM element takes them: `className`,
  `style`, `onFocus` and so on.
- `IconButton` has no `label` prop. Use `aria-label`.
- Styling is yours to choose. `className` with the admin's utility classes is preferred; an inline
  style object is fine where there is no class for it.
- You do not register anything. Saving the renderer is enough; it is applied to whichever fields
  select it.
