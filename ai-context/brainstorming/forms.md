# FormModel Brainstorming

## Problem

The current `packages/form` package starts and ends in React. `<Form>`, `<Bind>`, `useBind` — all form building, state, validation, and field registration is driven by the React component tree. This conflicts with the 3-layer observable architecture (Presenter/Repository/Gateway) where React should be a dumb view layer reacting to a ViewModel.

Current pain points:

- Form state lives inside React, not in the Presenter.
- Field registration happens via `<Bind>` mounting — the form doesn't know about fields until React renders them.
- Conditional visibility is JSX-driven (`{condition && <Bind>}`).
- onChange/value pipelines, validation timing, cross-field logic — all baked into React.
- List fields (arrays of objects) require manual index path building (`` `metaTags.${index}.name` ``), `DynamicFieldset` component, etc.

## Goal

A `FormModel` class in pure TypeScript that:

- Is owned by the Presenter (not React).
- Defines all fields, validation, visibility, and behavior declaratively.
- Uses MobX for observable state.
- Uses zod for validation schemas.
- Exposes a `vm` for the view — React just renders it.
- Follows the same fluent builder pattern as the Headless CMS `ModelBuilder` (`packages/api-headless-cms/src/features/modelBuilder/fields/**`).

## Reference Architecture

### 3-Layer Pattern (example: `packages/app-website-builder/src/presentation/navigation/NextjsConfig/`)

```
abstractions.ts    -> Interfaces + Abstraction tokens (Presenter, Repository, Gateway)
Presenter          -> owns state (MobX), exposes `vm` getter, orchestrates
Repository         -> holds domain data, calls gateway
Gateway            -> talks to external world (GraphQL)
feature.ts         -> DI registration (Presenter transient, Repository/Gateway singleton)
View.tsx           -> dumb React view, reads presenter.vm, done
```

### CMS Field Builder Pattern (example: `packages/api-file-manager/src/domain/file/file.model.ts`)

```ts
model.fields(fields => ({
    name: fields.text().label("Name").required("Value is required."),
    size: fields.number().label("Size").required("Value is required."),
    tags: fields.text().label("Tags").list().required("Value is required."),
    metadata: fields.object().label("Metadata").fields(fields => ({
        image: fields.object().label("Image").fields(fields => ({ ... }))
    }))
}));
```

Key elements:

- `FieldBuilder` base class with fluent API (label, help, placeholder, renderer, defaultValue, tags, etc.)
- Type-specific builders (`TextFieldBuilder`, `NumberFieldBuilder`, etc.) with type-specific validators.
- `FieldBuilderRegistry` — Proxy-based, so `fields.text()` / `fields.number()` / `fields.object()` are factory methods.
- `.list()` is a modifier on any field type — flips cardinality from singular to plural.
- `.fields(fields => (...))` on `ObjectFieldType` for nesting.
- Module augmentation per field type for TypeScript autocomplete on the registry.
- Validator mixin interfaces (`RequiredValidator`, `MinLengthValidator`, etc.).

## Design Decisions

### Field Definition

Fields are defined in the Presenter via a fluent builder, not by mounting React components:

```ts
this.form = new FormModel<PageSettings>({
  validateOnSubmit: true, // default; false = validate on every onChange
  fields: fields => ({
    title: fields
      .text()
      .label("Page Title")
      .placeholder("Enter page title")
      .schema(z.string().min(1, "Title is required")),

    slug: fields
      .text()
      .label("Slug")
      .beforeChange(slugify)
      .schema(
        z
          .string()
          .min(1, "Slug is required")
          .refine(async value => {
            const exists = await api.slugExists(value);
            return !exists;
          }, "Already taken")
      ),

    metaTags: fields
      .object()
      .label("Meta Tags")
      .list()
      .fields(fields => ({
        name: fields.text().label("Name").schema(z.string().min(1, "Name is required")),
        content: fields.text().label("Content").schema(z.string().min(1, "Content is required"))
      }))
      .listSchema(z.array().max(20, "Maximum 20 meta tags"))
  }),
  layout: layout => [
    layout.row("title", "slug"),
    layout.object("metaTags", [layout.row("name", "content")])
  ]
});
```

### Validation: Zod

- Per-field: `.schema(z.string().email())` — validates individual field values.
- Per-list: `.listSchema(z.array().max(20))` — validates the array itself (length, etc.).
- Per-form (cross-field): via `addRule()` — see Form-Level Rules below.
- Only visible, enabled fields participate in validation.

### Validation Flow and Error Surface

Validation is triggered by the Presenter (typically on a button click), not automatically. `form.validate()` returns a boolean and populates error state as a side effect — MobX reactivity handles the rest:

```ts
class EntryPresenter {
  async save() {
    const isValid = this.form.validate();
    if (!isValid) {
      // form.errors and per-field validation states are now populated
      // VM re-renders automatically via MobX
      return;
    }

    this.submitting = true;
    const data = this.form.getData();
    await this.repository.save(this.entry.id, data);
    this.submitting = false;
  }
}
```

**Error access at three levels:**

1. **Flat error list** — for a summary banner at the top of the form:

```ts
form.errors;
// [
//   { path: "title", label: "Page Title", message: "Title is required" },
//   { path: "metaTags.2.name", label: "Name", message: "Name is required" },
//   { path: "metaTags", label: "Meta Tags", message: "Maximum 20 meta tags" },
// ]
```

Paths use dot notation with numeric indices for list items (`metaTags.2.name`). `label` is included so the banner can show human-readable field names.

2. **Per-field validation** — already on each field's VM for inline display:

```ts
form.field("title").validation;
// { isValid: false, message: "Title is required" }

form.field("metaTags").items[2].field("name").validation;
// { isValid: false, message: "Name is required" }
```

3. **Section-level rollup** — object/list fields expose whether any descendant is invalid:

```ts
form.field("metaTags").hasErrors; // true if any item has any invalid field
form.field("metadata").hasErrors; // true if any nested field is invalid
```

This enables highlighting tabs/sections that contain errors:

```tsx
<Tab label="Meta Tags" hasError={vm.metaTags.hasErrors} />
```

No exceptions, no callbacks. Just state transitions — `validate()` populates observable error state, MobX re-renders the view.

### `.list()` as a Field Modifier

`.list()` is a modifier on any field type, not a separate field type. Mirrors the CMS pattern.

| Field type             | Singular value      | After `.list()`       |
| ---------------------- | ------------------- | --------------------- |
| `text()`               | `string`            | `string[]`            |
| `number()`             | `number`            | `number[]`            |
| `select()`             | `string`            | `string[]`            |
| `object().fields(...)` | `{ name, content }` | `{ name, content }[]` |

For simple lists (`fields.text().list()`), the field exposes `items` with value/onChange per item.
For object lists (`fields.object().list().fields(...)`), each item exposes its own nested fields.

List operations: `addItem()`, `removeItem(index)`, `moveItem(from, to)`.

### Templates on Object Fields (Dynamic Zones)

There is no dedicated `dynamicZone` field type. Instead, the `object` field supports an optional `.templates()` modifier. A templated object list is an object list where each item's fields are determined by a template selection:

```ts
content: fields
  .object()
  .label("Content Blocks")
  .list()
  .templates([
    {
      id: "hero",
      name: "Hero Banner",
      fields: fields => ({
        heading: fields.text().label("Heading"),
        image: fields.file().label("Image")
      })
    },
    {
      id: "richText",
      name: "Rich Text",
      fields: fields => ({
        body: fields.richText().label("Body")
      })
    },
    {
      id: "premium",
      name: "Premium Widget",
      visible: () => this.form.getValue("plan") === "enterprise",
      fields: fields => ({
        config: fields.json().label("Config")
      })
    }
  ]);
```

**Discriminator:** Each item carries a `_templateId` field that identifies which template is active. This matches the existing CMS data format:

```json
[
  { "_templateId": "hero", "heading": "Welcome", "image": "..." },
  { "_templateId": "richText", "body": "Lorem ipsum..." }
]
```

**Behavior:**

- On `setData()`: reads `_templateId` from each item, matches to template definition, instantiates that template's fields.
- On `addItem({ _templateId: "hero" })`: the template ID is enough — the FormModel looks up the template, instantiates its fields, and populates default values. The renderer shows a template picker with available templates, then calls `addItem()` with the selected ID.
- On `getData()`: each item includes `_templateId` alongside field values.
- The renderer has access to the field definition (including template list) and handles template selector UI.

**Template visibility:** Each template supports an optional `visible` callback — a MobX computed that controls whether the template appears in the picker for new items. Existing items with a hidden template remain visible and editable — visibility only affects the picker, not existing data.

This avoids a separate field type — dynamic zones are just object lists with template-driven field sets.

### Options (Select / MultiSelect)

`.options()` accepts a static array or a reactive function:

```ts
type Option = { label: string; value: string };

// Static
role: fields.select().options([
  { label: "Admin", value: "admin" },
  { label: "Editor", value: "editor" }
]);

// Reactive — computed from observable state
category: fields
  .select()
  .options(() => this.repository.categories.map(c => ({ label: c.name, value: c.id })));

// Dependent on another field — still just a computed
city: fields.select().options(() => {
  const country = this.form.getValue("country");
  return this.repository.citiesByCountry.get(country) ?? [];
});
```

Design decisions:

- When a function is provided, it's evaluated as a MobX computed — automatically re-derives when observed dependencies change.
- No loading/empty state handling — that's a Presenter/VM concern.
- No auto-clearing of values when options change — validation catches invalid selections.
- `Option` is `{ label: string; value: string }` — no generics, no groups, no metadata for now.

### Conditional Visibility

Defined in the Presenter, not JSX:

```ts
permissions: fields
  .multiSelect()
  .label("Permissions")
  .visible(() => this.form.getValue("role") === "admin");
```

`visible()` is a computed MobX reaction. Hidden fields are excluded from validation and from the VM.

### Form-Level Rules (Cross-Field Validation)

Two complementary approaches:

**Zod refinements (declarative):**

```ts
this.form.addRule(
  z.refine(data => data.endDate > data.startDate, {
    message: "End date must be after start date",
    path: ["endDate"]
  })
);
```

**Imperative rules (for complex logic needing FormModel access):**

```ts
this.form.addRule((data, form) => {
  if (form.getField("discount").visible && !data.discountCode) {
    form.setFieldError("discountCode", "Required when discount is enabled");
  }
});
```

Validation order: field schemas first, then form-level rules.

### Default Values

`.defaultValue()` accepts a static value or a factory function:

```ts
// Static
status: fields.text().defaultValue("draft");

// Factory — called each time a default is needed (e.g., per addItem())
id: fields
  .text()
  .renderer("hidden")
  .defaultValue(() => generateId());

// Factory with form access — default depends on current form state
currency: fields.text().defaultValue(form => (form.getValue("country") === "US" ? "USD" : "EUR"));
```

Behavior:

- Static values are used as-is.
- Factory functions (`(form) => T`) are called each time the FormModel needs a default — once per `addItem()` for list items, once on form init for top-level fields. The factory receives the form instance for reading current state.
- This is a **one-shot read**, not reactive — the default is set once at creation time, then the user owns the value.
- On `setData()`, defaults (static or factory) only apply to **missing** fields — existing data is never overwritten.

Common use case — hidden auto-generated IDs in list items:

```ts
metaTags: fields
  .object()
  .label("Meta Tags")
  .list()
  .fields(fields => ({
    id: fields
      .text()
      .renderer("hidden")
      .defaultValue(() => generateId()),
    name: fields.text().label("Name"),
    content: fields.text().label("Content")
  }));
```

Each `addItem()` call creates a new item with a unique `id`, while `name` and `content` start empty.

### Data Hydration

`form.setData(data)` hydrates the form with external data (e.g., from an API response):

```ts
async load(id: string) {
    const page = await this.repository.getById(id);
    this.form.setData(page);
}
```

After `setData({ title: "My Page", metaTags: [{ name: "desc", content: "..." }, ...] })`:

- Scalar fields get their values set.
- List fields instantiate the correct number of item VMs with nested field values populated.
- `form.isDirty` → `false` (baseline is reset).

Behavior:

- **Dirty tracking resets** — `setData()` establishes a new baseline. Only subsequent user edits make the form dirty. This is distinct from `field.setValue()` which marks the form dirty.
- **No validation on hydrate** — data came from the API, presumably valid. Validation only triggers on user interaction or explicit `form.validate()` / `form.submit()`.
- **Partial data supported** — missing fields fall back to their `.defaultValue()` (if defined) or type defaults. This is essential for form evolution (new fields added over time) and decorator-added fields.
- **Re-hydration** — calling `setData()` again fully replaces state, resets dirty tracking, and clears all validation errors.

### Per-Field Renderer Hint

Fields can specify a renderer name to select a specific component from the renderer registry:

```ts
description: fields.text().label("Description").renderer("textarea"); // picks TextareaRenderer instead of default TextRenderer

avatar: fields.text().label("Avatar").renderer("image"); // picks ImageRenderer
```

If no `.renderer()` is specified, the registry falls back to the default renderer for that field type.

### Generic Form Rendering

The generic renderer walks the layout tree, resolving field references to the FormModel. Two renderers work together: a **layout node renderer** (dispatches by node type) and a **field renderer** (dispatches by field type + renderer hint).

**Field VM** — each field exposes a VM for the renderer:

```ts
interface FieldVM {
    name: string;
    type: "text" | "number" | "select" | "multiSelect" | "object" | ...;
    label: string;
    placeholder?: string;
    help?: string;
    value: any;
    validation: { isValid: boolean | null; message?: string };
    validating: boolean;            // true while async validation is in-flight
    visible: boolean;
    disabled: boolean;
    renderer?: string;              // renderer hint
    options?: Option[];             // for select/multiSelect
    onChange: (value: any) => void;
}
```

**Field renderer registry** — maps field type (+ optional renderer hint) to a React component:

```tsx
const fieldRenderers: Record<string, React.FC<{ field: FieldVM }>> = {
  text: TextFieldRenderer,
  "text:textarea": TextareaFieldRenderer,
  "text:image": ImageFieldRenderer,
  number: NumberFieldRenderer,
  select: SelectFieldRenderer,
  multiSelect: MultiSelectFieldRenderer
};

const FieldRenderer = observer(({ field, renderers }) => {
  if (!field.visible) return null;
  const key = field.renderer ? `${field.type}:${field.renderer}` : field.type;
  const Renderer = renderers[key] ?? renderers[field.type];
  return <Renderer field={field} />;
});
```

**Layout node renderer** — dispatches by node type, recurses for nested structures:

```tsx
const LayoutNodeRenderer = observer(({ node, form, fieldScope, renderers }) => {
  switch (node.type) {
    case "row":
      return (
        <div className="flex gap-md">
          {node.fieldIds.map(id => {
            // Dot-notation paths are resolved from the form root,
            // unless we're inside an ObjectNode (fieldScope !== form).
            const field =
              fieldScope === form
                ? form.resolveField(id) // handles "seo.metaTitle" dot paths
                : fieldScope.field(id); // relative within object/item
            return <FieldRenderer key={id} field={field.vm} renderers={renderers} />;
          })}
        </div>
      );

    case "separator":
      return <hr />;

    case "element":
      if (node.visible && !node.visible()) return null;
      const Element = renderers[`element:${node.renderer}`];
      return <Element form={form} {...node.props} />;

    case "tabs":
      return <TabsRenderer node={node} form={form} fieldScope={fieldScope} renderers={renderers} />;

    case "object":
      const objField = form.resolveField(node.fieldId);

      // Single object — render inner layout once.
      if (!objField.isList) {
        return (
          <div>
            {node.layout.map((child, i) => (
              <LayoutNodeRenderer
                key={i}
                node={child}
                form={form}
                fieldScope={objField}
                renderers={renderers}
              />
            ))}
          </div>
        );
      }

      // List — iterate items, pick template or default layout.
      return (
        <div>
          <label>{objField.label}</label>
          {objField.items.map((item, index) => {
            const itemLayout = node.templates ? node.templates[item.templateId] : node.layout;
            return (
              <div key={index}>
                {itemLayout.map((child, i) => (
                  <LayoutNodeRenderer
                    key={i}
                    node={child}
                    form={form}
                    fieldScope={item}
                    renderers={renderers}
                  />
                ))}
                <button onClick={() => objField.removeItem(index)}>Remove</button>
              </div>
            );
          })}
          <button onClick={() => objField.addItem()}>Add</button>
        </div>
      );
  }
});
```

**Top-level `<FormView>`:**

```tsx
const FormView = observer(({ form, renderers }) => (
  <div>
    {form.layout.map((node, i) => (
      <LayoutNodeRenderer key={i} node={node} form={form} fieldScope={form} renderers={renderers} />
    ))}
  </div>
));
```

**Two modes of usage coexist:**

| Mode                  | When to use                                                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| **Generic rendering** | Simple settings forms, CRUD, admin panels — `<FormView form={form} />` and done                  |
| **Manual VM**         | Complex layouts, conditional sections, custom UX — Presenter builds the VM, View is hand-crafted |

### Decorability

Each FormModel has a dedicated modifier abstraction. The Presenter creates the form with defaults, then passes it through each modifier in sequence:

```ts
// Modifier abstraction — one per form.
const PageSettingsFormModifier = createAbstraction<FormModifier<PageSettings>>();

class PageSettingsPresenter {
    constructor(
        private repository: PageSettingsRepository.Interface,
        private modifiers: PageSettingsFormModifier.Interface[],
    ) {
        this.form = new FormModel<PageSettings>({
            fields: fields => ({ ... }),
            layout: layout => [ ... ],
        });

        for (const modifier of this.modifiers) {
            modifier.modify(this.form);
        }

        makeAutoObservable(this);
    }
}
```

**FormModel mutation API — three methods:**

| Method                              | Behavior                                                                                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `form.fields(fields => ({ ... }))`  | Merges new fields into the existing field map. Same key without `.extend()` replaces the field. Same key with `.extend()` merges child fields (objects only). |
| `form.layout(layout => [ ... ])`    | Appends layout nodes to the existing layout tree.                                                                                                             |
| `form.setLayout(layout => [ ... ])` | Replaces the entire layout tree.                                                                                                                              |

**Modifier examples:**

```ts
// Add a new top-level field.
class AddCustomFieldModifier implements FormModifier<PageSettings> {
    modify(form: FormModel<PageSettings>) {
        form.fields(fields => ({
            customField: fields.text().label("Custom"),
        }));

        form.layout(layout => [
            layout.row("customField"),
        ]);
    }
}

// Extend an existing object field with new child fields.
class AddOgFieldsModifier implements FormModifier<PageSettings> {
    modify(form: FormModel<PageSettings>) {
        form.fields(fields => ({
            seo: fields.extend().object().fields(fields => ({
                ogDescription: fields.text().label("OG Description"),
                ogLocale: fields.text().label("OG Locale"),
            })),
        }));

        form.layout(layout => [
            layout.row("seo.ogDescription", "seo.ogLocale"),
        ]);
    }
}

// Replace the entire layout.
class CustomLayoutModifier implements FormModifier<PageSettings> {
    modify(form: FormModel<PageSettings>) {
        form.setLayout(layout => [
            layout.tabs([ ... ]),
        ]);
    }
}
```

The `.extend()` pattern matches the CMS model builder (`fields.extend().object().fields(...)`) — without `.extend()`, redefining the same key replaces the field entirely.

## Full Example

### Presenter

```ts
import { makeAutoObservable } from "mobx";
import { z } from "zod";

class PageSettingsPresenter {
  private form: FormModel<PageSettings>;
  private submitting = false;

  constructor(private repository: PageSettingsRepository.Interface) {
    this.form = new FormModel<PageSettings>({
      validateOnSubmit: true,
      fields: fields => ({
        title: fields
          .text()
          .label("Page Title")
          .placeholder("Enter page title")
          .schema(z.string().min(1, "Title is required"))
          .afterChange((value, form) => {
            // Auto-generate slug from title.
            if (!form.field("slug").dirty) {
              form.field("slug").setValue(value);
            }
          }),

        slug: fields
          .text()
          .label("Slug")
          .placeholder("page-slug")
          .schema(
            z
              .string()
              .min(1, "Slug is required")
              .refine(async value => {
                const exists = await this.repository.slugExists(value);
                return !exists;
              }, "This slug is already taken")
          )
          .beforeChange(slugify),

        metaTags: fields
          .object()
          .label("Meta Tags")
          .list()
          .fields(fields => ({
            name: fields
              .text()
              .label("Name")
              .placeholder("e.g. description")
              .schema(z.string().min(1, "Name is required")),
            content: fields
              .text()
              .label("Content")
              .placeholder("e.g. My page description")
              .schema(z.string().min(1, "Content is required"))
          }))
          .listSchema(z.array().max(20, "Maximum 20 meta tags"))
      }),
      layout: layout => [
        layout.row("title", "slug"),
        layout.separator(),
        layout.object("metaTags", [layout.row("name", "content")])
      ]
    });

    makeAutoObservable(this);
  }

  get vm() {
    const form = this.form;

    return {
      title: {
        label: form.field("title").label,
        placeholder: form.field("title").placeholder,
        value: form.field("title").value,
        validation: form.field("title").validation,
        onChange: (v: string) => form.field("title").setValue(v)
      },
      slug: {
        label: form.field("slug").label,
        placeholder: form.field("slug").placeholder,
        value: form.field("slug").value,
        validation: form.field("slug").validation,
        validating: form.field("slug").validating,
        onChange: (v: string) => form.field("slug").setValue(v)
      },
      metaTags: {
        label: form.field("metaTags").label,
        items: form.field("metaTags").items.map((item, index) => ({
          index,
          name: {
            placeholder: item.field("name").placeholder,
            value: item.field("name").value,
            validation: item.field("name").validation,
            onChange: (v: string) => item.field("name").setValue(v)
          },
          content: {
            placeholder: item.field("content").placeholder,
            value: item.field("content").value,
            validation: item.field("content").validation,
            onChange: (v: string) => item.field("content").setValue(v)
          },
          remove: () => form.field("metaTags").removeItem(index)
        })),
        addItem: () => form.field("metaTags").addItem(),
        validation: form.field("metaTags").validation
      },
      canSubmit: form.isValid && form.isDirty && !this.submitting,
      submitting: this.submitting,
      submit: () => this.save()
    };
  }

  async save() {
    this.submitting = true;
    try {
      const data = await this.form.submit();
      await this.repository.save(data);
    } finally {
      this.submitting = false;
    }
  }
}
```

### React View (dumb)

```tsx
import React from "react";
import { observer } from "mobx-react-lite";
import { Input, Button, IconButton, FormComponentLabel } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";

export const PageSettingsView = observer(({ vm }) => {
  return (
    <div>
      {/* Title field */}
      <div>
        <FormComponentLabel text={vm.title.label} />
        <Input
          value={vm.title.value}
          onChange={vm.title.onChange}
          placeholder={vm.title.placeholder}
          invalid={vm.title.validation.isValid === false}
        />
        {vm.title.validation.isValid === false && (
          <span className="text-destructive">{vm.title.validation.message}</span>
        )}
      </div>

      {/* Meta tags list field */}
      <div>
        <FormComponentLabel text={vm.metaTags.label} />

        {vm.metaTags.items.map(item => (
          <div key={item.index} className="flex items-start gap-sm mt-md">
            <Input
              value={item.name.value}
              onChange={item.name.onChange}
              placeholder={item.name.placeholder}
              invalid={item.name.validation.isValid === false}
            />
            <Input
              value={item.content.value}
              onChange={item.content.onChange}
              placeholder={item.content.placeholder}
              invalid={item.content.validation.isValid === false}
            />
            <IconButton variant="ghost" icon={<DeleteIcon />} onClick={item.remove} />
          </div>
        ))}

        {vm.metaTags.validation.isValid === false && (
          <span className="text-destructive">{vm.metaTags.validation.message}</span>
        )}

        <div className="mt-md">
          <Button
            onClick={vm.metaTags.addItem}
            text="Add tag"
            variant="secondary"
            size="sm"
            icon={<AddIcon />}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="mt-lg">
        <Button
          onClick={vm.submit}
          text={vm.submitting ? "Saving..." : "Save"}
          disabled={!vm.canSubmit}
        />
      </div>
    </div>
  );
});
```

## Layout

### Separation of Fields and Layout

`fields` contains **only data fields** — no tabs, no separators, no layout concerns. All visual structure lives in `layout`. This separation enables:

- Clean `getData()` — just reads all fields, no skipping layout nodes or hoisting tab-scoped fields.
- Same form, different layouts — swap layouts per persona, device, or context at runtime.
- Independent decoration — decorators can modify fields and layout separately.
- Flat field registry — field discovery doesn't require traversing layout nodes.

### Layout Tree

Layout is a tree of nodes defined via a builder. Top-level scalar fields and nested object fields use **dot-notation paths** (`"seo.metaTitle"`). The only place relative field names exist is inside `layout.object()`, where field names are relative to the object/item — because list items are repeated and the index isn't known at definition time.

```ts
this.form = new FormModel<PageSettings>({
    fields: fields => ({
        title: fields.text().label("Title"),
        slug: fields.text().label("Slug"),
        description: fields.text().label("Description"),
        plan: fields.select().label("Plan").options([...]),
        seo: fields.object().fields(fields => ({
            metaTitle: fields.text().label("Meta Title"),
            metaDescription: fields.text().label("Meta Description"),
            ogImage: fields.file().label("OG Image"),
        })),
        blocks: fields.object().list().templates([
            {
                id: "hero",
                name: "Hero Banner",
                fields: fields => ({
                    heading: fields.text().label("Heading"),
                    image: fields.file().label("Image"),
                    cta: fields.text().label("CTA"),
                }),
            },
            {
                id: "twoColumn",
                name: "Two Column",
                fields: fields => ({
                    left: fields.richText().label("Left"),
                    right: fields.richText().label("Right"),
                    dividerStyle: fields.select().label("Divider"),
                }),
            },
        ]),
        metaTags: fields.object().list().fields(fields => ({
            name: fields.text().label("Name"),
            content: fields.text().label("Content"),
        })),
    }),
    layout: layout => [
        // Row with two fields side by side.
        layout.row("title", "slug"),

        layout.separator(),

        // Tabs — pure visual grouping, no data nesting.
        layout.tabs([
            {
                id: "general",
                label: "General",
                layout: [
                    layout.row("description"),
                ],
            },
            {
                id: "seo",
                label: "SEO",
                visible: () => this.form.getValue("title") !== "",
                layout: [
                    // Nested object fields — dot notation, no wrapper needed.
                    layout.row("seo.metaTitle", "seo.ogImage"),
                    layout.row("seo.metaDescription"),
                ],
            },
            {
                id: "content",
                label: "Content",
                layout: [
                    // Templated list — layout per template, field names relative to each item.
                    layout.object("blocks", {
                        hero: [
                            layout.row("heading"),
                            layout.row("image", "cta"),
                        ],
                        twoColumn: [
                            layout.row("left", "right"),
                            layout.row("dividerStyle"),
                        ],
                    }),
                ],
            },
            {
                id: "meta",
                label: "Meta Tags",
                layout: [
                    // Non-templated object list — single layout for all items.
                    layout.object("metaTags", [
                        layout.row("name", "content"),
                    ]),
                ],
            },
        ]),

        // Custom element — no data, just UI.
        layout.element("usage-stats", {
            visible: () => this.form.getValue("plan") === "enterprise",
        }),
    ],
});
```

### Layout Node Types

```ts
type LayoutNode = RowNode | SeparatorNode | TabsNode | ElementNode | ObjectNode;

interface RowNode {
  type: "row";
  fieldIds: string[]; // dot-notation paths: "title", "seo.metaTitle"
}

interface SeparatorNode {
  type: "separator";
}

interface TabsNode {
  type: "tabs";
  tabs: TabDefinition[];
  activeTabId: string; // observable
  setActiveTab(id: string): void;
}

interface TabDefinition {
  id: string;
  label: string | (() => string); // static or reactive
  visible?: () => boolean; // hides tab from UI; hidden = fields excluded from validation
  icon?: string;
  layout: LayoutNode[];
  hasErrors: boolean; // computed from form fields referenced in this tab's layout
}

interface ElementNode {
  type: "element";
  renderer: string;
  visible?: () => boolean;
  props?: Record<string, any>;
}

interface ObjectNode {
  type: "object";
  fieldId: string; // references an object field (singular, list, or templated list)
  layout?: LayoutNode[]; // array = single object or non-templated list (same layout per item)
  templates?: Record<string, LayoutNode[]>; // keyed by template ID = templated list
}
```

**`layout.object()` overloads:**

```ts
// Single object or non-templated list — array of layout nodes.
// The renderer checks the field definition to know if it's singular or .list().
layout.object("seo", [layout.row("metaTitle", "ogImage"), layout.row("metaDescription")]);

layout.object("metaTags", [layout.row("name", "content")]);

// Templated list — layout keyed by template ID.
layout.object("blocks", {
  hero: [layout.row("heading"), layout.row("image", "cta")],
  twoColumn: [layout.row("left", "right"), layout.row("dividerStyle")]
});
```

Field names inside `layout.object()` are **relative** to the object/item. This is the only place relative names exist — everywhere else uses dot-notation paths from the form root.

### Field Name Resolution

**Outside `layout.object()`** — field names are dot-notation paths from the form root. The renderer resolves them directly:

- `"title"` → `form.field("title")`
- `"seo.metaTitle"` → `form.field("seo").field("metaTitle")`

**Inside `layout.object()`** — field names are relative to the object/item. The renderer resolves them within the current scope:

- Inside `layout.object("seo", [...])`: `"metaTitle"` → `form.field("seo").field("metaTitle")`
- Inside `layout.object("blocks", { hero: [...] })` for item 3: `"heading"` → `form.field("blocks").items[3].field("heading")`

Both approaches resolve to the same result for single objects — the difference matters for lists, where the item index isn't known at definition time.

### Tabs

Tabs are purely visual grouping — they don't contribute data or own fields. Fields referenced inside a tab's layout are regular form fields defined in the flat `fields` map.

**Key behaviors:**

- **Data is flat** — `form.getValue("title")`, not scoped under a tab. `getData()` reads all fields directly.
- **Tab visibility** — reactive `visible` callback. A hidden tab means its fields are physically hidden and **excluded from validation** (same behavior as current React forms where hidden = unmounted).
- **Inactive tab** — an inactive (but visible) tab still participates in validation. "Hidden" means `visible: false`, not "tab not currently selected".
- **Programmatic tab switching** — `layout.tabs[0].setActiveTab("seo")`.
- **Error rollup** — each tab computes `hasErrors` from the validation state of the fields referenced in its layout tree.

```tsx
<Tab label="SEO" hasError={layout.tabs[0].tab("seo").hasErrors} />
```

### Default Layout

If no `layout` is specified, defaults to single-column top-to-bottom (one field per row, in definition order). Object fields auto-generate inner layouts the same way. Template fields without explicit template layouts use the template's field definition order.

## Validation Strategy

### Validation Timing

The FormModel accepts a `validateOnSubmit` option that controls when field validation runs:

```ts
this.form = new FormModel<PageSettings>({
  validateOnSubmit: true, // default
  fields: fields => ({
    title: fields.text().schema(z.string().min(1, "Required")),
    slug: fields.text().schema(
      z
        .string()
        .min(1, "Required")
        .refine(async v => !(await api.slugExists(v)), "Taken")
    )
  })
});
```

| `validateOnSubmit` | Behavior                                                                                                                                                                                |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `true` (default)   | No field validation until `form.submit()` / `form.validate()` is called for the first time. After the first submit attempt, every `onChange` triggers validation for the changed field. |
| `false`            | Every `onChange` immediately triggers validation for the changed field.                                                                                                                 |

In both modes, `form.validate()` / `form.submit()` always validates all fields.

### Async Validation via Zod Refine

Async validation uses zod's built-in `.refine()` with an async callback — no separate `.asyncValidator()` method:

```ts
slug: fields
  .text()
  .label("Slug")
  .schema(
    z
      .string()
      .min(1, "Required")
      .refine(async value => {
        const exists = await this.repository.slugExists(value);
        return !exists;
      }, "This slug is already taken")
  );
```

The FormModel always uses `schema.parseAsync()` internally, which handles both sync and async schemas uniformly. Zod runs sync validations first — if they fail, async refinements are skipped.

**Behavior:**

- On `onChange`: follows the same timing rules as sync validation (`validateOnSubmit` flag). When active, async refinements run on every change.
- On `form.validate()` / `form.submit()`: all field schemas run in parallel (`Promise.all`) across fields.
- `form.validate()` signature is `async validate(): Promise<boolean>`.
- **Memoized by input** — if the value hasn't changed since the last run, the previous result is returned immediately without re-executing the schema. This avoids redundant API calls (e.g., re-checking slug uniqueness on `form.submit()` when the slug was already validated on `onChange`).

**Field VM — `validating` flag:**

```ts
interface FieldVM {
  // ...existing
  validating: boolean; // true while async validation is in-flight
}
```

The FormModel detects whether a field's schema contains async refinements and sets `validating: true` while `parseAsync()` is in-flight.

### Debouncing

Async schemas triggered by `onChange` are automatically debounced (default 300ms) to avoid excessive API calls during typing. The debounce interval is configurable per field:

```ts
slug: fields.text()
    .label("Slug")
    .debounce(500)
    .schema(z.string().min(1).refine(async (v) => ..., "Taken"))
```

Default debounce: 300ms. Sync validators are never debounced.

## Value Transformations

### `beforeChange`

A pipeline that transforms the value before it's stored. Runs synchronously on every `setValue()`:

```ts
slug: fields
  .text()
  .label("Slug")
  .beforeChange(slugify)
  .beforeChange(value => value.toLowerCase());
```

With form access:

```ts
code: fields
  .text()
  .label("Code")
  .beforeChange((value, form) => {
    const prefix = form.getValue("country");
    return `${prefix}-${value}`;
  });
```

**Behavior:**

- Multiple `.beforeChange()` calls chain left-to-right (pipe).
- The field's `value` observable gets the **transformed** result. The view sees the transformed value.
- Runs only on user-driven `setValue()`, **not** on `setData()` hydration — API data is already in final form.
- Sync-only — async transforms belong in the Presenter.

### `afterChange`

A hook for side effects after a field value changes:

```ts
country: fields.select()
    .label("Country")
    .options([...])
    .afterChange((value, form) => {
        form.field("city").setValue("");
        form.field("currency").setValue(value === "US" ? "USD" : "EUR");
    })
```

**Behavior:**

- Runs after `beforeChange` transforms and after the value is stored.
- Multiple `.afterChange()` calls chain — all run in definition order.
- Receives the final (post-transform) value.
- Runs only on user-driven `setValue()`, **not** on `setData()`.
- Sync-only — for async side effects (e.g., fetching cities), trigger from the Presenter by observing the field value.
- `afterChange` does **not** re-trigger `beforeChange`/`afterChange` on the fields it modifies via `setValue()` — it calls an internal `setValueSilent()` to avoid cascading loops. If cascading is truly needed, the Presenter should handle it explicitly.

Wait — actually, `afterChange` modifying other fields via `form.field("city").setValue("")` **should** trigger those fields' own `beforeChange`/`afterChange` pipelines, since the intent is to simulate a user change. Loop protection is handled by a recursion guard (max depth or dirty check), not by silencing the pipeline.

**Revised behavior:**

- `afterChange` calls to `setValue()` on other fields **do** trigger those fields' `beforeChange`/`afterChange` pipelines.
- Recursion is guarded — if `afterChange` triggers a cycle (A changes B, B changes A), the guard stops after one round (a field's `afterChange` won't re-fire if its value didn't actually change).

## Decided

1. **Zod schema composition** — the FormModel will attempt to auto-compose per-field `.schema()` definitions and form-level `addRule()` rules into a single `z.object()` internally. If full composition becomes too complex, fall back to validating fields individually + running form rules separately — as long as the form validates correctly.

2. **Item identity for lists** — array index is sufficient. No need for auto-generated unique keys or user-specified key fields.

3. **`moveItem(from, to)`** — deferred, not included for now.

4. **Package** — FormModel lives in the `app-admin` package (`@webiny/app-admin`).

5. **Migration** — clean break. FormModel is a new feature, implemented for new modules only. No migration of existing `packages/form` usage.

6. **`beforeChange` runs only on `setValue()`** — not on `setData()` hydration. API data is already in final form.

7. **`afterChange` runs only on `setValue()`** — not on `setData()`. Cascading is allowed: `afterChange` calling `setValue()` on other fields triggers those fields' pipelines. Recursion guard: a field's `afterChange` won't re-fire if its value didn't actually change.

8. **Validation timing** — controlled by `validateOnSubmit` (default `true`). When `true`, no field validation until first `form.submit()` / `form.validate()`, then every `onChange` validates the changed field. When `false`, every `onChange` validates immediately.

9. **Async validation via zod refine** — no separate `.asyncValidator()` method. Async checks use `z.refine(async ...)` inside `.schema()`. The FormModel always uses `parseAsync()` internally, which handles both sync and async schemas uniformly.

10. **Async schema debouncing** — async schemas triggered by `onChange` are debounced (default 300ms, configurable per field via `.debounce()`). Sync-only schemas are never debounced.

11. **Async schema memoization** — if the input value is the same as the previous run, the cached result is returned without re-executing `parseAsync()`.

12. **Fields and layout are separate concerns** — `fields` contains only data fields (no tabs, separators, elements). All visual structure lives in `layout`. This enables clean `getData()`, runtime layout swapping, and independent decoration.

13. **Dot-notation field paths in layout** — top-level and nested object fields use dot-notation paths (`"seo.metaTitle"`) in the layout. The only place relative field names exist is inside `layout.object()`, where names are relative to the object/item.

14. **`layout.object()` unifies object and list layouts** — `layout.object("fieldId", LayoutNode[])` handles single objects and non-templated lists (array form). `layout.object("fieldId", Record<string, LayoutNode[]>)` handles templated lists (keyed by template ID). The renderer checks the field definition to distinguish singular vs list. No separate `ListNode` type.

15. **Hidden tab = excluded from validation** — a tab with `visible: false` means its fields are physically hidden and don't participate in validation. An inactive (but visible) tab still validates. This matches the current React behavior where hidden = unmounted.
