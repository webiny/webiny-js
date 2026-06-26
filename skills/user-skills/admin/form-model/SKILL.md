---
name: webiny-form-model
context: webiny-admin
description: >
  Building forms with the FormModel system — field types, renderers, layout, validation,
  conditional rules, computed fields, and dynamic zones. Use this skill when the developer
  needs to define form fields with the builder API, choose renderers, build layouts with
  tabs/rows/separators, add validation (Zod or imperative), use conditional visibility/disable
  rules, create computed fields, or work with object fields and templates (dynamic zones).
---

# Form Model

## TL;DR

The Form Model is Webiny's declarative form system. Define fields with a fluent builder API (`fields.text()`, `fields.datetime()`, etc.), arrange them with a layout builder (`layout.row()`, `layout.tabs()`, etc.), and validate with Zod schemas or imperative rules. Fields support conditional visibility, computed values, reactive context from other fields (`.context()`), and deeply nested object/list structures with templates (dynamic zones).

## Field Types

All fields are created via the `fields` registry callback. Each builder method returns a chainable builder.

### Text

```typescript
fields.text();
```

Default renderer: `textInput`. Value: `string | null`.

```typescript
fields.text().label("Title").placeholder("Enter title").required("Title is required")
fields.text().renderer("textarea", { rows: 4 })
fields.text().list().renderer("tags").defaultValue([])
fields.text().list().renderer("textInputs", { addItemLabel: "Add text" })
fields.text().list().renderer("textareas", { addItemLabel: "Add description" })
fields.text().renderer("codeEditor", { language: "html", height: 300 })
fields.text().options([
    { label: "Option A", value: "a" },
    { label: "Option B", value: "b" }
])  // auto-switches to "dropdown" renderer
fields.text().options([...]).renderer("radioButtons")
fields.text().list().options([...]).renderer("checkboxes")

// Dynamic options — callback receives IFormModel, re-evaluated reactively
fields.text().options(form => {
    const type = form.field("general.type").getValue();
    return getOptionsForType(type);
})
```

### Number

```typescript
fields.number();
```

Default renderer: `numberInput`. Value: `number | null`. Auto-normalizes to number.

```typescript
fields.number().label("Count").placeholder("0").required();
fields.number().list().renderer("numberInputs", { addItemLabel: "Add number" });
fields.number().options([
  { label: "Tier 1", value: 100 },
  { label: "Tier 2", value: 200 }
]);
```

### Boolean

```typescript
fields.boolean();
```

Default renderer: `switch`. Value: `boolean | null`.

```typescript
fields.boolean().label("Featured").defaultValue(false);
```

### DateTime

```typescript
fields.datetime();
```

Default renderer: `dateTimeInput`. Pick a variant method to set the subtype:

| Variant                                   | Value Format                   | Example                 |
| ----------------------------------------- | ------------------------------ | ----------------------- |
| `.dateOnly()`                             | `"2026-05-01"`                 | Birthdays, due dates    |
| `.timeOnly()`                             | `"14:30:00"`                   | Opening hours           |
| `.withTimezone()`                         | `"2026-05-01T14:30:00+02:00"`  | Events tied to a locale |
| `.withoutTimezone()`                      | `"2026-05-01T14:30:00.000Z"`   | Timestamps, logs        |
| `.monthOnly()`                            | `"2026-05"`                    | Billing cycles          |
| `.weekOnly({ startsOn: 1 })`              | `"2026-W18"`                   | Sprint planning         |
| `.yearOnly({ range: [2020, 2035] })`      | `2026` (number)                | Fiscal years            |
| `.dateRange()`                            | `{ from: "...", to: "..." }`   | Vacation requests       |
| `.multipleDates()`                        | `["2026-05-01", "2026-05-03"]` | Blackout dates          |
| `.multipleMonths()`                       | `["2026-01", "2026-03"]`       | Seasonal availability   |
| `.multipleYears({ range: [2020, 2035] })` | `[2024, 2025, 2026]`           | Multi-year budgets      |

Additional chainable methods:

```typescript
.presets([
    { label: "Today", value: () => new Date() },
    { label: "In a week", value: () => addDays(new Date(), 7) }
])
.displayFormat("dd/MM/yyyy")  // date-fns format tokens
.list()  // switches renderer to "dateTimeInputs"
```

### File

```typescript
fields.file();
```

Default renderer: `filePicker`. Value: `FileValue | null` (object with `id`, `name`, `size`, `mimeType`, `src`, `width`, `height`).

```typescript
fields.file().label("Image");
```

### File URL

```typescript
fields.fileUrl();
```

Default renderer: `fileUrlPicker`. Value: `string | null` (URL only).

```typescript
fields.fileUrl().label("Image URL");
```

### Lexical

```typescript
fields.lexical();
```

Default renderer: `lexical`. Value: `RichTextValueWithHtml | null` (`{ state: string; html: string }`).

```typescript
fields.lexical().label("Content").required("Content is required");
```

### Password

```typescript
fields.password();
```

Default renderer: `passwordInput`. Value: `string | null`.

```typescript
fields.password().label("Password").required("Password is required");
```

### Permissions

```typescript
fields.permissions();
```

Default renderer: `permissions`. Value: `Record<string, unknown>[]`. Has a built-in Zod schema requiring at least one permission entry.

```typescript
fields.permissions().label("Permissions");
```

### Roles Multi-Select

```typescript
fields.rolesMultiSelect();
```

Default renderer: `rolesMultiSelect`. Value: `unknown[]`.

```typescript
fields.rolesMultiSelect().label("Roles");
```

### Object

```typescript
fields.object();
```

Default renderer: `objectAccordionSingle`. For nested structures, lists, and dynamic zones.

```typescript
// Simple nested object
fields.object().label("Address").fields(f => ({
    street: f.text().label("Street"),
    city: f.text().label("City"),
    zip: f.text().label("ZIP")
}))

// List of objects
fields.object().list().label("Authors").fields(f => ({
    name: f.text().label("Name").required(),
    email: f.text().label("Email")
}))

// Dynamic zone (single template selection)
fields.object().label("Content Block")
    .template("hero", t => {
        t.label("Hero Banner")
            .icon({ type: "icon", name: "fas/image" })
            .fields(f => ({
                heading: f.text().label("Heading").required(),
                image: f.file().label("Image")
            }));
    })
    .template("text", t => {
        t.label("Rich Text").fields(f => ({
            body: f.text().label("Body").renderer("textarea")
        }));
    })

// Dynamic zone list (multiple items, each picks a template)
fields.object().list().label("Page Sections")
    .renderer("dynamicZone", { container: false })
    .template("hero", t => { ... })
    .template("cta", t => { ... })

// Key-value list
fields.object().list().label("Meta Tags")
    .renderer("keyValueTags", { addItemLabel: "Add tag" })
    .fields(f => ({
        name: f.text().placeholder("Name"),
        content: f.text().placeholder("Content")
    }))
```

Template visibility can be conditional:

```typescript
.template("premium", t => {
    t.label("Premium Widget")
        .visible(form => form.field("plan").getValue() === "enterprise")
        .fields(f => ({ ... }));
})
```

## Common Builder Methods

These are available on **all** field types:

| Method                        | Description                                               |
| ----------------------------- | --------------------------------------------------------- |
| `.label(text)`                | Field label                                               |
| `.description(text)`          | Description text below the field                          |
| `.help(text)`                 | Help text                                                 |
| `.note(text)`                 | Supplementary note                                        |
| `.placeholder(text)`          | Input placeholder                                         |
| `.defaultValue(value)`        | Default value (can be a function for dynamic defaults)    |
| `.required(message?)`         | Mark as required                                          |
| `.requiredWhen(fn, message?)` | Conditionally required based on other field values        |
| `.schema(zodSchema)`          | Zod validation schema                                     |
| `.renderer(name, settings?)`  | Override the default renderer                             |
| `.options([...])`             | Add value options (auto-switches text/number to dropdown) |
| `.list()`                     | Convert to array field                                    |
| `.hidden()`                   | Hide the field (value still in form data)                 |
| `.hiddenWhen(fn)`             | Conditionally hide based on form state                    |
| `.disabled(value?)`           | Disable the field                                         |
| `.disabledWhen(fn)`           | Conditionally disable based on form state                 |
| `.rules([...])`               | Conditional visibility/disable rules                      |
| `.computed(fn)`               | Always-computed value from other fields                   |
| `.computedUntilDirty(fn)`     | Computed until user edits the field                       |
| `.beforeChange(fn)`           | Transform value before change                             |
| `.afterChange(fn)`            | Side effects after value changes                          |
| `.afterSetValue(fn)`          | Side effects after programmatic value set                 |
| `.onBlur(fn)`                 | Blur event callback                                       |
| `.cloneValue(fn)`             | Custom clone logic for list item duplication              |
| `.context(fn)`                | Inject reactive context from other fields into the VM     |
| `.tags([...])`                | Tag the field for programmatic lookup                     |

## Renderers

### Complete Renderer Reference

| Renderer                  | Field Type                 | Settings                                                        | Description                                                  |
| ------------------------- | -------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ |
| `textInput`               | text                       | —                                                               | Single-line text input (default for text)                    |
| `textarea`                | text                       | `{ rows?: number }`                                             | Multi-line text area                                         |
| `textInputs`              | text (list)                | `{ addItemLabel?: string }`                                     | List of text inputs                                          |
| `textareas`               | text (list)                | `{ addItemLabel?: string }`                                     | List of textareas                                            |
| `tags`                    | text (list)                | —                                                               | Comma-separated tag input                                    |
| `codeEditor`              | text                       | `{ language?: string; height?: number }`                        | Code editor with syntax highlighting                         |
| `dropdown`                | text, number               | —                                                               | Select dropdown (auto-selected when `.options()` is used)    |
| `radioButtons`            | text, number               | —                                                               | Radio button group (requires `.options()`)                   |
| `checkboxes`              | text (list), number (list) | —                                                               | Checkbox group (requires `.options()` + `.list()`)           |
| `numberInput`             | number                     | —                                                               | Number input (default for number)                            |
| `numberInputs`            | number (list)              | `{ addItemLabel?: string }`                                     | List of number inputs                                        |
| `switch`                  | boolean                    | —                                                               | Toggle switch (default for boolean)                          |
| `dateTimeInput`           | datetime                   | `{ type, displayFormat?, yearRange?, weekStartsOn?, presets? }` | Date/time picker (default for datetime)                      |
| `dateTimeInputs`          | datetime (list)            | `{ type, displayFormat?, weekStartsOn?, addItemLabel? }`        | List of date/time pickers                                    |
| `lexical`                 | lexical                    | —                                                               | Lexical rich text editor (default for lexical)               |
| `filePicker`              | file                       | —                                                               | File picker with full metadata (default for file)            |
| `fileUrlPicker`           | fileUrl                    | —                                                               | File picker returning URL only (default for fileUrl)         |
| `objectAccordionSingle`   | object                     | `{ open?: boolean }`                                            | Single object in accordion (default for object)              |
| `objectAccordionMultiple` | object (list)              | `{ open?, container?, itemTitle?, addItemLabel? }`              | List of objects in accordions (auto for `.list()`)           |
| `dynamicZone`             | object (templates)         | `{ container?: boolean }`                                       | Template picker zone (auto for `.template()`)                |
| `passthrough`             | object                     | —                                                               | Renders child fields inline without wrapper                  |
| `keyValueTags`            | object (list)              | `{ addItemLabel?: string }`                                     | Key-value tag pairs                                          |
| `hidden`                  | any                        | —                                                               | Hidden field (no UI rendered, but field stays visible in VM) |
| `passwordInput`           | password                   | —                                                               | Password input (default for password)                        |
| `permissions`             | permissions                | —                                                               | Permissions editor (default for permissions)                 |
| `rolesMultiSelect`        | rolesMultiSelect           | —                                                               | Roles multi-select (default for rolesMultiSelect)            |

### Automatic Renderer Switching

- Calling `.options()` on text/number fields switches to `dropdown`
- Calling `.list()` on datetime switches to `dateTimeInputs`
- Calling `.list()` on object switches to `objectAccordionMultiple`
- Calling `.template()` on object switches to `dynamicZone`

## Layout

Layout controls how fields are arranged in the UI. Defined via the `layout` callback.

### Basic Layout

```typescript
layout: layout => [
  layout.row("title"), // single field row
  layout.row("firstName", "lastName"), // two fields side by side
  layout.separator() // visual divider
];
```

### Tabs

```typescript
layout: layout => [
  layout
    .tabs("myTabs")
    .tab("general", tab => {
      tab
        .label("General")
        .icon({ type: "icon", name: "fas/cog" })
        .description("Basic settings")
        .layout(l => [l.row("title"), l.row("description")]);
    })
    .tab("advanced", tab => {
      tab.label("Advanced").layout(l => [l.row("config")]);
    })
];
```

Vertical tabs (used by page settings):

```typescript
layout.tabs("settings-tabs").renderer("tabsVertical");
```

Tabs with renderer settings:

```typescript
layout.tabs("field-settings").renderer("tabsHorizontal", {
  spacing: "lg",
  size: "md",
  separator: true
});
```

Tab-level conditional visibility:

```typescript
.tab("premium", tab => {
    tab.label("Premium")
        .rules([{
            type: "condition",
            target: "plan",
            operator: "neq",
            value: "enterprise",
            action: "hide"
        }])
        .layout(l => [...]);
})
```

### Object Layout

For object fields, define inner layout per template or for a flat object:

```typescript
// Flat object
layout.object("address", l => [l.row("street"), l.row("city", "zip")]);

// Per-template layout (for dynamic zones)
layout.object("sections", {
  hero: inner => [inner.row("heading", "subheading"), inner.row("image")],
  cta: inner => [inner.row("label", "url")]
});
```

### Positioning

When modifying an existing layout (e.g., in a modifier), use `.after()` or `.before()` to position relative to existing fields:

```typescript
layout.row("newField").after("existingField");
layout.row("anotherField").before("existingField");
```

## Validation

### Field-Level (Zod)

```typescript
import { z } from "zod";

fields.text().label("Email").schema(z.string().email("Must be a valid email"));

fields
  .text()
  .label("URL")
  .schema(z.string().refine(val => !val || URL_REGEX.test(val), "Invalid URL format"));
```

### Conditional Required

```typescript
fields
  .text()
  .label("Seats")
  .requiredWhen(form => form.field("plan").getValue() === "pro", "Pro plan requires a seat count");
```

### Form-Level Rules

```typescript
// Zod cross-field validation
form.addRule(
  z
    .object({
      password: z.string().nullable(),
      confirm: z.string().nullable()
    })
    .refine(d => d.password === d.confirm || (!d.password && !d.confirm), {
      message: "Passwords must match",
      path: ["confirm"]
    })
);

// Imperative validation
form.addRule(form => {
  const slug = String(form.field("slug").getValue() ?? "");
  if (slug.length > 0 && slug.length < 3) {
    return [{ path: "slug", message: "Slug must be at least 3 characters" }];
  }
  return [];
});
```

## Conditional Rules (Visibility / Disable)

Rules control field visibility and disabled state based on other field values:

```typescript
fields
  .text()
  .label("Feature Name")
  .rules([
    {
      type: "condition",
      target: "enableFeature", // field to watch
      operator: "isFalsy", // condition
      value: null, // comparison value (null for unary operators)
      action: "hide" // "hide" or "disable"
    }
  ]);
```

Multiple rules can be chained (all are evaluated):

```typescript
fields
  .text()
  .label("Advanced Config")
  .rules([
    {
      type: "condition",
      target: "enableFeature",
      operator: "isFalsy",
      value: null,
      action: "hide"
    },
    {
      type: "condition",
      target: "featureMode",
      operator: "neq",
      value: "advanced",
      action: "disable"
    }
  ]);
```

### Available Operators

| Operator       | Description                                   |
| -------------- | --------------------------------------------- |
| `"eq"`         | Equal to value                                |
| `"neq"`        | Not equal to value                            |
| `"isEmpty"`    | Null, undefined, empty string, or empty array |
| `"isNotEmpty"` | Has a non-empty value                         |
| `"isTruthy"`   | Boolean coercion is true                      |
| `"isFalsy"`    | Boolean coercion is false                     |
| `"matches"`    | Exact string match                            |

## Scoped Field Paths (`$.` prefix)

Inside callbacks on nested fields (`computed`, `computedUntilDirty`, `hiddenWhen`, `disabledWhen`, `requiredWhen`, `options`, `beforeChange`, `afterChange`, `onBlur`), the `form` parameter supports a `$.` prefix to resolve paths relative to the field's parent object:

```typescript
fields
  .object()
  .renderer("passthrough")
  .fields(f => ({
    label: f.text().defaultValue("Hello"),
    slug: f.text().computedUntilDirty(form =>
      String(form.field("$.label").getValue() || "")
        .toLowerCase()
        .replace(/\s+/g, "-")
    )
  }));
```

`$.label` resolves to the `label` sibling within the same parent object. Without `$.`, paths are absolute from the form root. The `$.` prefix can traverse into sibling objects too: `$.settings.preset` resolves to `settings.preset` relative to the parent.

> **Note:** The `.context()` callback does NOT use the `$.` prefix convention. It uses a dedicated `field` navigator with `.parent().field()` for relative traversal and a separate `form` param for absolute access. See [Field Context](#field-context).

## Conditional Visibility / Disable (callback form)

For dynamic visibility and disabled state that depends on other field values:

```typescript
// Hide a field based on a sibling value
fields
  .text()
  .label("Details")
  .hiddenWhen(form => form.field("$.mode").getValue() !== "advanced");

// Disable based on a root-level field
fields
  .text()
  .label("Name")
  .disabledWhen(form => Boolean(form.field("locked").getValue()));
```

Both `hiddenWhen` and `disabledWhen` accept `(form: IFormModel) => boolean`. Multiple calls chain — any returning true triggers the effect.

## Computed Fields

```typescript
// Always computed — recalculated when dependencies change
fields
  .text()
  .label("Full Name")
  .computed(form => `${form.field("first").getValue()} ${form.field("last").getValue()}`);

// Computed until the user edits the field manually
fields
  .text()
  .label("Slug")
  .computedUntilDirty(form => {
    const name = String(form.field("title").getValue() ?? "");
    return name.trim().toLowerCase().replace(/\s+/g, "-");
  });
```

## Cross-Field Interaction

Use `.afterChange()` to react to value changes and modify other fields:

```typescript
fields
  .text()
  .label("Visibility")
  .options([
    { label: "Public", value: "public" },
    { label: "Password Protected", value: "password" }
  ])
  .afterChange((value, form) => {
    const path = form.field("general.path").as("text").getValue() ?? "";
    if (value === "password") {
      form.field("general.path").setValue(path + "/protected");
    } else {
      form.field("general.path").setValue(path.replace("/protected", ""));
    }
  });
```

## Field Context

Use `.context()` to push data from other fields into a field's VM. The renderer reads it via `field.context` — no hooks, no reaching up to the parent form. The callback is MobX-reactive: only the specific fields accessed inside it trigger re-renders.

The callback receives `{ field, form }`:
- **`field`** — a navigator scoped to the current field. Call `.parent()` to get the containing object, then `.field(name)` to access fields at that level. Chain `.parent()` to go higher.
- **`form`** — the root `IFormModel` for absolute field access.

### Sibling access (fields at the same level)

```typescript
fields
  .file()
  .label("Media")
  .context(({ field }) => ({
    title: field.parent().field("title").getValue(),
    description: field.parent().field("description").getValue()
  }))
```

### Nested field accessing root-level fields

```typescript
// Inside an object: settings > media needs root-level "title"
fields
  .object()
  .label("Settings")
  .fields(f => ({
    media: f
      .file()
      .context(({ form }) => ({
        title: form.field("title").getValue()
      }))
  }))
```

### Deep nesting — traversing multiple levels up

```typescript
// settings > nested > media needs settings-level "label"
fields
  .object()
  .label("Settings")
  .fields(f => ({
    label: f.text().defaultValue("Settings Label"),
    nested: f.object().fields(inner => ({
      media: inner
        .file()
        .context(({ field }) => ({
          // parent() = nested, parent().parent() = settings
          label: field.parent().parent().field("label").getValue()
        }))
    }))
  }))
```

### Using both field navigator and form

```typescript
fields
  .file()
  .label("Media")
  .context(({ field, form }) => ({
    // Relative: sibling via parent
    label: field.parent().field("label").getValue(),
    // Absolute: root-level field
    slug: form.field("slug").getValue()
  }))
```

### Reading context in a renderer

```typescript
const MediaPickerRenderer = createFieldRenderer<"mediaPicker">(({ field }) => {
    const { title, description } = field.context as { title: string; description: string };
    return <MediaPicker field={field} title={title} description={description} />;
});
```

Fields without `.context()` have `field.context` defaulting to `{}`.

## Extending Object Fields After Creation

Object fields can be extended with additional children (modifier pattern):

```typescript
// Original definition
profile: fields
  .object()
  .label("Profile")
  .fields(f => ({
    title: f.text().label("Title")
  }));

// Later: add more fields
form
  .field("profile")
  .as("object")
  .fields(f => ({
    company: f.text().label("Company"),
    bio: f.text().label("Short bio")
  }));
```

## Runtime Template Management

Templates on object fields can be added/removed at runtime:

```typescript
const sections = form.field("sections").as("object");

sections.templates.remove("text");

sections.templates.add("runtimeBanner", t => {
  t.label("Runtime Banner").fields(f => ({
    headline: f.text().label("Headline").required(),
    note: f.text().label("Note")
  }));
});
```

## Form API

### Submit with Skip Validation

```typescript
// Normal submit — validates first, returns false if invalid
const data = await form.submit();

// Skip validation — returns data immediately
const data = await form.submit({ skipValidation: true });
```

### FormVM

The `IFormVM` exposes reactive state for the UI:

```typescript
form.vm.layout; // LayoutNodeVM[] — resolved layout nodes
form.vm.errors; // IFormError[] — current validation errors
form.vm.hasErrors; // boolean — shorthand for errors.length > 0
form.vm.isDirty; // boolean — any field changed from initial value
form.vm.isValid; // boolean | null — null until first validation
form.vm.submitCount; // number — increments on each submit attempt
form.vm.focusField(path); // scroll to and focus a field
form.vm.getData(); // current form data snapshot
form.vm.setData(); // replace all form data
```

### FormErrors Component

```typescript
import { FormErrors } from "@webiny/app-admin";

<FormErrors form={presenter.vm.form} className="my-4" />
```

Renders an alert with all validation errors. Accepts an optional `className` prop.

## Related Skills

- **webiny-page-settings-extensions** — Adding new settings groups or modifying existing ones in the Website Builder page settings drawer
