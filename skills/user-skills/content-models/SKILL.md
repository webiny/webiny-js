---
name: webiny-api-cms-content-models
description: >
  Creating Headless CMS content models via code using the ModelFactory pattern.
  Use this skill when the developer wants to create, modify, or understand content model
  definitions, define fields and validators, set up reference fields between models,
  configure field layouts (including nested layouts inside object or dynamicZone fields),
  pick the correct Admin UI renderer for a field type (textInput/textInputs,
  lexicalEditor/lexicalEditors, file/files, objectAccordionSingle/objectAccordionMultiple, etc.),
  or work with the ModelFactory builder API. Also covers field types
  (text, longText, number, boolean, datetime, asset, file, ref, object, richText, dynamicZone),
  list (array) fields via .list() and the singular-vs-plural renderer rule,
  validation (required, unique, email, pattern, minLength, maxLength, gte, predefinedValues),
  single-entry (singleton) models via .singleEntry(), model/field tags via .tags(),
  and field rules via .rules() for access-control and conditional visibility/editability.
  Includes the correct `fields` projection syntax when querying entries via the SDK:
  `ref` fields use double-`values.` nesting (e.g. `values.author.values.name`) because
  they resolve to another entry, while `object` and `dynamicZone` sub-fields are inline
  and use a single `values.` (e.g. `values.author.name`) — getting this wrong silently
  returns null.
---

# Creating Content Models via Code

## TL;DR

Content models are created using the `ModelFactory` pattern. You define a class implementing `ModelFactory.Interface`, use the fluent `ModelFactory.Builder` API to declare fields, validators, layout, and API names, then export with `ModelFactory.createImplementation()`. Register in `webiny.config.tsx` as `<Api.Extension>`.

## The ModelFactory Pattern

Every code-based content model follows the same structure:

```typescript
import { ModelFactory } from "webiny/api/cms/model";

class MyModelImpl implements ModelFactory.Interface {
  async execute(builder: ModelFactory.Builder) {
    return [
      builder
        .public({ modelId: "myModel", name: "My Model", group: "ungrouped" })
        .description("Description of the model")
        .fields(fields => ({
          // field definitions here
        }))
        .layout([/* row definitions */])
        .titleFieldId("fieldId")
        .singularApiName("MyModel")
        .pluralApiName("MyModels")
    ];
  }
}

export default ModelFactory.createImplementation({
  implementation: MyModelImpl,
  dependencies: []
});
```

Register in `webiny.config.tsx`:

```tsx
<Api.Extension src={"/extensions/MyModel.ts"} />
```

**YOU MUST include the full file path with the `.ts` extension in the `src` prop.** For example, use `src={"/extensions/MyModel.ts"}`, NOT `src={"/extensions/MyModel"}`. Omitting the file extension will cause a build failure.

**YOU MUST use `export default` for the `createImplementation()` call** when the file is targeted directly by an Extension `src` prop. Using a named export (`export const MyModel = ...`) will cause a build failure. Named exports are only valid inside files registered via `createFeature`.

## Model Configuration Methods

| Method                                        | Purpose                                                                                                                                                                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.public({ modelId, name, group })`           | Creates a public model (accessible via Read API). `modelId` is the internal DB identifier. `group` organizes it in the Admin sidebar.                                                                                         |
| `.description("...")`                         | Model description shown in Admin UI                                                                                                                                                                                           |
| `.fields(fields => ({ ... }))`                | Define all fields using the fluent field builder                                                                                                                                                                              |
| `.layout([["field1", "field2"], ["field3"]])` | Arrange fields in rows in the Admin editor. Each inner array is one row.                                                                                                                                                      |
| `.titleFieldId("name")`                       | Which field to use as the entry's display title                                                                                                                                                                               |
| `.descriptionFieldId("message")`              | Which field to use as the entry's description                                                                                                                                                                                 |
| `.singularApiName("Product")`                 | Singular name for GraphQL queries (e.g., `getProduct`)                                                                                                                                                                        |
| `.pluralApiName("Products")`                  | Plural name for GraphQL queries (e.g., `listProducts`)                                                                                                                                                                        |
| `.singleEntry()`                              | Makes the model a singleton (only one entry can exist). Automatically adds the `"singleEntry"` tag.                                                                                                                           |
| `.tags(["tag1", "tag2"])`                     | Assign custom tags to the model. The tag `"type:model"` is always added automatically. Duplicates are removed.                                                                                                                |
| `.settings({ ... })`                          | Model settings. Supported properties: `aiEntryWizard` (boolean), `previewPrefix` (string — base URL for live preview, e.g. `"https://example.com/articles"`), `previewSlug` (string — slug template, e.g. `"{values.slug}"`). |

## Layout

`.layout()` takes a two-dimensional array of field IDs. Each inner array is one row in
the Admin editor, and each entry within a row is a column cell. Field IDs must exactly
match the keys used in `.fields()`.

### Top-level layout

```typescript
.layout([
  ["name", "slug"],   // row 1: two columns
  ["description"],    // row 2: one column, full width
  ["category", "price"]
])
```

### Nested layout inside an `object` field

`object` fields have their own `.fields()` and `.layout()` that only reference the
object's own sub-fields. The outer model layout should refer to the object field as a
whole; its internal arrangement is owned by the object itself.

```typescript
.fields((fields) => ({
  name: fields.text().renderer("textInput").label("Name"),
  address: fields
    .object()
    .renderer("objectAccordionSingle")
    .label("Address")
    .fields((sub) => ({
      street: sub.text().renderer("textInput").label("Street"),
      city:   sub.text().renderer("textInput").label("City"),
      zip:    sub.text().renderer("textInput").label("ZIP")
    }))
    .layout([
      ["street"],           // inner layout — only uses sub-field IDs
      ["city", "zip"]
    ])
}))
.layout([
  ["name"],
  ["address"]               // outer layout just references the object field
])
```

### Nested layout inside a `dynamicZone` field

`dynamicZone` is an array field where each entry is one of several named templates.
Every template declares its own fields **and** its own layout, scoped to that template.
The outer model layout simply references the dynamicZone field by its ID.

Each template config accepts an optional `componentName` property that maps the template
to a frontend UI component (e.g. `"Custom/Hero"`). This is used by the CMS live preview
and Website Builder to resolve which React component renders the template's data.

```typescript
.fields((fields) => ({
  blocks: fields
    .dynamicZone()
    .label("Content blocks")
    .template("hero", {
      name: "Hero",
      gqlTypeName: "HeroBlock",
      componentName: "Custom/Hero",
      fields: (t) => ({
        heading: t.text().renderer("textInput").label("Heading"),
        image:   t.asset().label("Image")
      }),
      layout: [
        ["heading"],          // layout inside the "hero" template only
        ["image"]
      ]
    })
    .template("quote", {
      name: "Quote",
      gqlTypeName: "QuoteBlock",
      componentName: "Custom/Quote",
      fields: (t) => ({
        text:   t.longText().renderer("textarea").label("Quote text"),
        author: t.text().renderer("textInput").label("Author")
      }),
      layout: [
        ["text"],
        ["author"]
      ]
    })
}))
.layout([
  ["blocks"]                  // outer layout references the dynamicZone as a whole
])
```

Rule of thumb: **a layout can only reference field IDs in the same scope it's declared
in.** Model layout references model fields. Object layout references that object's
sub-fields. Each dynamicZone template's layout references only that template's fields.

## Field Types and Renderers

Every field type exposes two renderer variants: a **single-value** renderer (used by
default) and a **multi-value** renderer (used when the field is marked as a list via
`.list()`). You **MUST** pair the renderer with the cardinality: calling `.list()`
requires a renderer from the `list: true` column, and omitting `.list()` requires one
from the `list: false` column. Using the wrong variant will render incorrectly in the
Admin UI and the field may fail to save values. Invented names (e.g. `"fileInput"`,
`"lexicalTextInput"`, `"objectInput"`, `"boolean"`) will silently misbehave the same way.

Exception: `fields.boolean()` has no multi-value variant — do not call `.list()` on
boolean fields.

The authoritative source for these field types is the `webiny/api/cms/model` barrel export — if you're unsure, check the catalog skill `webiny-api-cms-catalog`.

| Builder Method         | Description                                                    | Single (`list: false`)                                              | Multiple (`list: true`)                                               |
| ---------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `fields.text()`        | Single-line text                                               | `"textInput"`                                                       | `"textInputs"`                                                        |
| `fields.longText()`    | Multi-line text                                                | `"textarea"`                                                        | `"textareas"`                                                         |
| `fields.richText()`    | Rich text (Lexical)                                            | `"lexicalEditor"`                                                   | `"lexicalEditors"`                                                    |
| `fields.number()`      | Numeric value                                                  | `"numberInput"`                                                     | `"numberInputs"`                                                      |
| `fields.boolean()`     | True/false toggle                                              | `"switch"`                                                          | — (not supported)                                                     |
| `fields.datetime()`    | Date/time picker                                               | `"dateTimeInput"`                                                   | `"dateTimeInputs"`                                                    |
| `fields.asset()`       | Asset (image/video/document with per-usage crop & focal point) | `"asset-input"`                                                     | `"asset-inputs"`                                                      |
| `fields.file()`        | File/image attachment (deprecated, use `asset`)                | `"file"`                                                            | `"files"`                                                             |
| `fields.ref()`         | Reference to another model                                     | `"refDialogSingle"`, `"refAutocompleteSingle"`, `"refRadioButtons"` | `"refDialogMultiple"`, `"refAutocompleteMultiple"`, `"refCheckboxes"` |
| `fields.object()`      | Nested object with sub-fields                                  | `"objectAccordionSingle"`                                           | `"objectAccordionMultiple"`                                           |
| `fields.dynamicZone()` | Dynamic zone (choose-one-of-N templates)                       | `"dynamicZone"`                                                     | _(implicitly a list; see below)_                                      |

### Renderer Settings

Some renderers accept a `settings` object as the second argument to `.renderer()`:

```typescript
.renderer("dynamicZone", { container: false, addItemLabel: "Add block" })
.renderer("objectAccordionSingle", { open: false, container: true, itemTitle: "name" })
.renderer("objectAccordionMultiple", { itemTitle: "title", addItemLabel: "Add section" })
```

| Renderer                     | Setting           | Type                | Default         | Description                                                   |
| ---------------------------- | ----------------- | ------------------- | --------------- | ------------------------------------------------------------- |
| `dynamicZone`                | `open`            | `boolean`           | `true`          | Whether the accordion is expanded by default                  |
| `dynamicZone`                | `container`       | `boolean`           | `true`          | Wrap in a container panel; `false` for flat inline layout     |
| `dynamicZone`                | `addItemLabel`    | `string`            | `"Add Item"`    | Label for the add-item button                                 |
| `objectAccordionSingle`      | `open`            | `boolean`           | `true`          | Whether the accordion is expanded by default                  |
| `objectAccordionSingle`      | `container`       | `boolean`           | `true`          | Wrap in a container panel; `false` for flat inline layout     |
| `objectAccordionSingle`      | `itemTitle`       | `string`            | field label     | Field ID whose value is used as the accordion title           |
| `objectAccordionSingle`      | `itemDescription` | `string`            | —               | Field ID whose value is used as the accordion description     |
| `objectAccordionMultiple`    | `open`            | `boolean`           | `true`          | Whether each accordion item is expanded by default            |
| `objectAccordionMultiple`    | `container`       | `boolean`           | `true`          | Wrap in a container panel; `false` for flat inline layout     |
| `objectAccordionMultiple`    | `itemTitle`       | `string`            | field label     | Field ID whose value is used as each item's title             |
| `objectAccordionMultiple`    | `itemDescription` | `string`            | —               | Field ID whose value is used as each item's description       |
| `objectAccordionMultiple`    | `addItemLabel`    | `string`            | `"Add {label}"` | Label for the add-item button                                 |
| `assetField` / `assetFields` | `imagesOnly`      | `boolean`           | `false`         | Only allow image files                                        |
| `assetField` / `assetFields` | `accept`          | `string[]`          | all types       | MIME types to allow (e.g. `["image/png", "application/pdf"]`) |
| `refDialogMultiple`          | `newItemPosition` | `"first" \| "last"` | `"last"`        | Where newly picked references are inserted                    |

### Ref renderer families

The three `ref` renderer families look and behave very differently in the Admin UI —
pick the one that fits your UX:

- **Dialog** (`refDialogSingle` / `refDialogMultiple`) — opens a modal with a searchable,
  filterable picker. Best for large reference sets.
- **Autocomplete** (`refAutocompleteSingle` / `refAutocompleteMultiple`) — inline
  typeahead input. Best for moderate reference sets.
- **Inline** (`refRadioButtons` / `refCheckboxes`) — renders all referenced entries as
  inline controls. Best for small, fixed reference sets.

### Alternative text/number renderers (with `predefinedValues`)

When a `text` or `number` field uses `.predefinedValues([...])`, additional renderers
become available:

- `"radioButtons"` — single-value; requires `list: false` and `predefinedValues`.
- `"select"` — single-value; requires `list: false` and `predefinedValues`.
- `"dropdown"` — **deprecated**, alias for `"select"`. Use `"select"` instead.
- `"checkboxes"` — multi-value; requires `list: true` and `predefinedValues`.
- `"tags"` — multi-value free-form entry; `text` only, requires `list: true` and NO
  `predefinedValues`.

### List fields and renderer pluralization

When a field uses `.list()` (i.e. stores an array of values), the renderer **must** be the
plural variant from the right-hand column above. Pairing `.list()` with the singular
renderer causes the Admin UI to render the wrong component and the field will fail to
save correctly.

**Correct** — list of tags uses the plural `"textInputs"` renderer:

```typescript
tags: fields
  .text()
  .list()
  .renderer("textInputs") // plural, because .list() is chained
  .label("Tags");
```

**Wrong** — singular renderer on a list field (this is the pattern that breaks silently):

```typescript
tags: fields
  .text()
  .list()
  .renderer("textInput") // WRONG: should be "textInputs"
  .label("Tags");
```

The same rule applies to every field type that has both variants:
`richText().list()` → `"lexicalEditors"`, `file().list()` → `"files"`,
`longText().list()` → `"textareas"`, `number().list()` → `"numberInputs"`,
`object().list()` → `"objectAccordionMultiple"`, and so on.

For `ref()` fields the pluralization rule is the same but the singular/multiple renderers
have distinct names (e.g. `refDialogSingle` → `refDialogMultiple`) — see the table.

## Layout Fields

Layout fields are UI-only elements that do not store data. They decorate the editor
form with visual structure. Place them in `.fields()` like data fields, and reference
them by key in `.layout()`.

All layout fields inherit the base methods: `.label()`, `.help()`, `.description()`,
`.note()`, `.fieldId()`, `.rules()`.

| Builder Method         | Description                                     | Extra Methods                                              |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `fields.uiSeparator()` | Horizontal divider with an optional label       | —                                                          |
| `fields.uiAlert()`     | Colored banner (info, success, warning, danger) | `.alertType("info" \| "success" \| "warning" \| "danger")` |
| `fields.uiTabs()`      | Tabbed container that groups fields into tabs   | `.tab(id, config)` — see below                             |

### uiSeparator

A horizontal line to visually separate field groups. The label appears as section text.

```typescript
.fields(fields => ({
  name: fields.text().renderer("textInput").label("Name"),
  divider: fields.uiSeparator().label("Additional Info"),
  bio: fields.longText().renderer("textarea").label("Bio")
}))
.layout([["name"], ["divider"], ["bio"]])
```

### uiAlert

A colored callout banner. Use `.alertType()` to set the severity.

```typescript
.fields(fields => ({
  warning: fields
    .uiAlert()
    .label("Changes to this section require approval.")
    .alertType("warning"),
  title: fields.text().renderer("textInput").label("Title")
}))
.layout([["warning"], ["title"]])
```

### uiTabs

Groups fields into tabs. Each tab has its own fields and layout. Fields inside tabs
are hoisted to the model level (flat field list), but visually grouped under their tab.

`.tab(id, config)` accepts:

| Config Property | Type                                             | Required | Description                   |
| --------------- | ------------------------------------------------ | -------- | ----------------------------- |
| `label`         | `string`                                         | yes      | Tab label                     |
| `icon`          | `CmsIcon`                                        | no       | Tab icon                      |
| `description`   | `string`                                         | no       | Tab description               |
| `fields`        | `(registry) => Record<string, BaseFieldBuilder>` | yes      | Fields inside this tab        |
| `layout`        | `string[][]`                                     | no       | Layout for fields in this tab |
| `rules`         | `FieldRule[]`                                    | no       | Rules for this individual tab |

```typescript
.fields(fields => ({
  tabs: fields
    .uiTabs()
    .tab("general", {
      label: "General",
      fields: sub => ({
        title: sub.text().renderer("textInput").label("Title").required(),
        slug: sub.text().renderer("textInput").label("Slug").required()
      }),
      layout: [["title", "slug"]]
    })
    .tab("seo", {
      label: "SEO",
      fields: sub => ({
        seoTitle: sub.text().renderer("textInput").label("SEO Title"),
        seoDescription: sub.longText().renderer("textarea").label("SEO Description")
      }),
      layout: [["seoTitle"], ["seoDescription"]],
      rules: [
        { type: "accessControl", target: "identity", operator: "matches", value: "team:marketing", action: "hide" }
      ]
    })
}))
.layout([["tabs"]])
```

The outer `.layout()` references `"tabs"` as a single cell. Tab-internal layouts only
reference their own field keys (same scoping rule as object/dynamicZone layouts).

## Field Validators (Chainable)

| Validator                  | Description                         | Example                                                  |
| -------------------------- | ----------------------------------- | -------------------------------------------------------- |
| `.required("msg")`         | Field is required                   | `.required("Name is required")`                          |
| `.unique()`                | Value must be unique across entries | `.unique()`                                              |
| `.email()`                 | Must be a valid email               | `.email()`                                               |
| `.pattern(regex, msg)`     | Must match a regex                  | `.pattern("^[a-z0-9-]+$", "Lowercase and hyphens only")` |
| `.minLength(n)`            | Minimum string length               | `.minLength(2)`                                          |
| `.maxLength(n)`            | Maximum string length               | `.maxLength(100)`                                        |
| `.gte(n, msg)`             | Greater than or equal (numbers)     | `.gte(0, "Must be non-negative")`                        |
| `.predefinedValues([...])` | Restrict to predefined options      | `.predefinedValues([{ label: "Work", value: "work" }])`  |

## Field Configuration (Chainable)

| Method                          | Description                                                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `.renderer("rendererName")`     | Set the Admin UI renderer                                                                                        |
| `.label("Display Name")`        | Field label in the editor                                                                                        |
| `.help("Helper text")`          | Helper text shown below the field                                                                                |
| `.list()`                       | Make the field accept multiple values (arrays). Requires a multi-value renderer variant — see Field Types table. |
| `.models([{ modelId: "..." }])` | For `ref()` fields: which models can be referenced                                                               |
| `.tags(["tag1"])`               | Assign tags to a field (e.g., `"$bulk-edit"`)                                                                    |
| `.rules([...])`                 | Conditional visibility/editability rules — see [Field Rules](#field-rules) section                               |

## Field Rules

`.rules()` accepts an array of `FieldRule` objects that control field visibility and
editability in the Admin UI. Rules are evaluated client-side. Available on **all** field
types (data fields and layout fields — separators, alerts, tabs).

Each rule has the shape:

```typescript
interface FieldRule {
  type: "accessControl" | "condition";
  target: string;
  operator: string;
  value: string | number | boolean | null;
  action: "hide" | "disable";
}
```

### Rule types

| `type`            | Purpose                                                                                                | `target`                                     | `value`                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------- |
| `"accessControl"` | Show/hide or enable/disable a field based on the current user's identity or team membership            | `"identity"`                                 | `"admin:<userId>"` or `"team:<teamSlug>"`               |
| `"condition"`     | Show/hide or enable/disable a field based on the current entry's field values (reactive, updates live) | Field path, e.g. `"status"` or `"seo.title"` | The value to compare against (type depends on operator) |

### Actions

| `action`    | Effect                                                            |
| ----------- | ----------------------------------------------------------------- |
| `"hide"`    | Hides the field entirely from the editor                          |
| `"disable"` | Shows the field but makes it read-only (greyed out, not editable) |

### Condition operators

Operators available for `type: "condition"` rules, grouped by target field type:

| Operator       | Label            | Applicable to                   | `value`                   |
| -------------- | ---------------- | ------------------------------- | ------------------------- |
| `"=="`         | Equals           | text, number, boolean, datetime | The value to match        |
| `"!="`         | Not equals       | text, number, boolean, datetime | The value to not match    |
| `">"`          | Greater than     | number, datetime                | Numeric/date threshold    |
| `"<"`          | Less than        | number, datetime                | Numeric/date threshold    |
| `">="`         | Greater or equal | number, datetime                | Numeric/date threshold    |
| `"<="`         | Less or equal    | number, datetime                | Numeric/date threshold    |
| `"contains"`   | Contains         | text, long-text                 | Substring to search for   |
| `"startsWith"` | Starts with      | text, long-text                 | Prefix to match           |
| `"endsWith"`   | Ends with        | text, long-text                 | Suffix to match           |
| `"isEmpty"`    | Is empty         | all field types                 | `null` (value is ignored) |
| `"isNotEmpty"` | Is not empty     | all field types                 | `null` (value is ignored) |

### Access control operators

| Operator    | Description                                                   |
| ----------- | ------------------------------------------------------------- |
| `"matches"` | Checks if the current user's identity or team matches `value` |

### Target field paths (condition rules)

The `target` for condition rules is a **dot-separated field path** relative to the form
root. Use the field's `fieldId` (the key in the `.fields()` callback).

- Simple field: `"status"`
- Nested inside object: `"seo.title"`, `"address.city"`
- Inside a list item (current index): `"items.$.name"` — the `$` resolves to the
  current list index at evaluation time
- Array length: `"items.length"` — evaluates to the number of items in the array
- **Static relative path**: `"$.fieldId"` — resolves relative to the **parent object or
  template** that contains the field. Use this inside `object`, `dynamicZone` template,
  or `uiTabs` scopes to reference a sibling field without hard-coding the full path.
  For example, inside a dynamicZone template, `"$.enabled"` resolves to the sibling
  `enabled` field within the same template instance. This is the recommended approach
  for rules inside nested scopes — it keeps the rule portable and avoids coupling to
  the parent field's name.

### Examples

**Access control — hide field from non-marketing team:**

```typescript
title: fields
  .text()
  .renderer("textInput")
  .label("Marketing Title")
  .rules([
    {
      type: "accessControl",
      target: "identity",
      operator: "matches",
      value: "team:marketing",
      action: "hide"
    }
  ]);
```

**Condition — disable field when another field is empty:**

```typescript
seoDescription: fields
  .longText()
  .renderer("textarea")
  .label("SEO Description")
  .rules([
    { type: "condition", target: "seoTitle", operator: "isEmpty", value: null, action: "disable" }
  ]);
```

**Condition — show field only when status equals "published":**

```typescript
publishDate: fields
  .datetime()
  .renderer("dateTimeInput")
  .label("Publish Date")
  .rules([
    { type: "condition", target: "status", operator: "!=", value: "published", action: "hide" }
  ]);
```

**Multiple rules on a single field:**

```typescript
internalNotes: fields
  .longText()
  .renderer("textarea")
  .label("Internal Notes")
  .rules([
    {
      type: "accessControl",
      target: "identity",
      operator: "matches",
      value: "team:editors",
      action: "hide"
    },
    { type: "condition", target: "status", operator: "==", value: "draft", action: "disable" }
  ]);
```

**Rules on layout fields (separator, alert, tabs):**

```typescript
.fields(fields => ({
  adminAlert: fields
    .uiAlert()
    .label("Admin only")
    .alertType("warning")
    .rules([
      { type: "accessControl", target: "identity", operator: "matches", value: "team:admins", action: "hide" }
    ]),
}))
```

**Rules on individual tabs:**

```typescript
.fields(fields => ({
  tabs: fields
    .uiTabs()
    .tab("general", {
      label: "General",
      fields: sub => ({ /* ... */ }),
      layout: [/* ... */]
    })
    .tab("advanced", {
      label: "Advanced",
      fields: sub => ({ /* ... */ }),
      layout: [/* ... */],
      rules: [
        { type: "accessControl", target: "identity", operator: "matches", value: "team:developers", action: "hide" }
      ]
    })
    .rules([/* rules on the entire tabs container */])
}))
```

**Static `$.` paths — referencing siblings inside a nested scope:**

Use `$.` to target a sibling field within the same parent object or dynamicZone
template. The `$` resolves to the parent path at runtime, so the rule stays portable
regardless of the outer structure.

```typescript
.fields(fields => ({
  bannerTypes: fields
    .dynamicZone()
    .label("Banner Type")
    .template("siteBanner", {
      name: "Site Banner",
      gqlTypeName: "SiteBannerBlock",
      fields: t => ({
        enabled: t.boolean().renderer("switch").label("Enabled"),
        text: t.richText().renderer("lexicalEditor").label("Text"),
        global: t
          .boolean()
          .renderer("switch")
          .label("Global"),
        locationTab: t
          .uiTabs()
          .tab("Location", {
            label: "Location",
            fields: tabFields => ({
              location: tabFields.text().label("Location")
            }),
            layout: [["location"]]
          })
          .rules([
            {
              type: "condition",
              target: "$.global",      // resolves to sibling "global" in this template
              operator: "==",
              value: true,
              action: "hide"
            }
          ])
      }),
      layout: [["enabled"], ["text"], ["global"], ["locationTab"]]
    })
}))
```

In this example, `"$.global"` resolves to the `global` field within the same
dynamicZone template instance. Without the `$.` prefix, you would need to hard-code the
full path (e.g. `"bannerTypes.0.global"`), which breaks across list indices. The same
pattern works inside `object` fields and `uiTabs` scopes.

## Querying `ref`, `object`, and `dynamicZone` fields

When you read entries via the Webiny SDK (or GraphQL), the `fields` array tells the API
which fields to return. **The nesting syntax depends on the field type**, and getting it
wrong silently returns `null` for the nested value.

### `ref` fields — double `values.` nesting

A reference field returns the **referenced entry**, which itself has its own `values`
wrapper around its fields. To project a sub-field of a referenced entry, you must
include the inner `values.` segment.

```typescript
// article model has: author: fields.ref().models([{ modelId: "author" }])
const { result } = await cms.articles.list({
  fields: [
    "id",
    "values.title",
    "values.author.values.name" // ref → double "values."
    // ^^^^^^^^^^^^^^^^^^^^^^^^^
  ]
});
```

If `author` is a `.list()` ref field, the same rule applies — each item in the returned
array is an entry with its own `values` wrapper, so you still write
`values.authors.values.name`.

### `object` and `dynamicZone` fields — no inner `values.`

Object and dynamicZone sub-fields are stored **inline** on the parent entry, with no
intermediate `values` wrapper. Access sub-fields with a plain dotted path.

```typescript
// article model has:
//   author: fields.object().fields(sub => ({ name: sub.text(), bio: sub.longText() }))
const { result } = await cms.articles.list({
  fields: [
    "id",
    "values.title",
    "values.author.name", // object → single "values."
    "values.author.bio"
    // ^^^^^^^^^^^^^^^^^
  ]
});
```

For `dynamicZone`, address sub-fields through the template name (still no inner
`values.`):

```typescript
// blocks: fields.dynamicZone().template("hero", { fields: t => ({ heading: t.text() }) })
fields: ["values.blocks.hero.heading"];
```

### Rule of thumb

- **`fields.ref()`** → the field resolves to another entry, so its sub-path goes through
  `.values.` (e.g. `values.author.values.name`).
- **`fields.object()` / `fields.dynamicZone()`** → the field is inline, so its sub-path
  is plain (e.g. `values.author.name`).

Mixing the two up is the most common cause of "the query worked but the field is
`null`" bugs. If you're unsure, cross-check the field definition in the model file.

## Full Examples

### Product Category Model

```typescript
// extensions/ProductCategoryModel.ts
import { ModelFactory } from "webiny/api/cms/model";

export const PRODUCT_CATEGORY_MODEL_ID = "productCategory";

class ProductCategoryModelImpl implements ModelFactory.Interface {
  async execute(builder: ModelFactory.Builder) {
    return [
      builder
        .public({
          modelId: PRODUCT_CATEGORY_MODEL_ID,
          name: "Product Category",
          group: "ungrouped"
        })
        .description("Product categories for organizing products")
        .fields(fields => ({
          name: fields
            .text()
            .renderer("textInput")
            .label("Name")
            .help("Name of the product category")
            .required("Name is required")
            .minLength(2)
            .maxLength(100),
          slug: fields
            .text()
            .renderer("textInput")
            .label("Slug")
            .help("URL-friendly identifier")
            .required("Slug is required")
            .unique(),
          description: fields.longText().renderer("textarea").label("Description").minLength(10)
        }))
        .layout([["name", "slug"], ["description"]])
        .titleFieldId("name")
        .singularApiName("ProductCategory")
        .pluralApiName("ProductCategories")
    ];
  }
}

export default ModelFactory.createImplementation({
  implementation: ProductCategoryModelImpl,
  dependencies: []
});
```

### Product Model (with Reference Field)

```typescript
// extensions/ProductModel.ts
import { ModelFactory } from "webiny/api/cms/model";

export const PRODUCT_MODEL_ID = "product";

class ProductModelImpl implements ModelFactory.Interface {
  async execute(builder: ModelFactory.Builder) {
    return [
      builder
        .public({
          modelId: PRODUCT_MODEL_ID,
          name: "Product",
          group: "ungrouped"
        })
        .description("Products for our e-commerce store")
        .fields(fields => ({
          name: fields
            .text()
            .renderer("textInput")
            .label("Name")
            .help("Product name")
            .required("Name is required"),
          sku: fields
            .text()
            .renderer("textInput")
            .label("SKU")
            .help("Stock Keeping Unit - unique product identifier")
            .required("SKU is required")
            .unique(),
          description: fields
            .longText()
            .renderer("textarea")
            .label("Description")
            .help("Detailed product description"),
          price: fields
            .number()
            .renderer("numberInput")
            .label("Price")
            .required("Price is required")
            .gte(0, "Price must be greater than or equal to 0"),
          category: fields
            .ref()
            .renderer("refDialogSingle")
            .label("Category")
            .models([{ modelId: "productCategory" }])
        }))
        .layout([["name"], ["sku"], ["category"], ["description"], ["price"]])
        .titleFieldId("name")
        .singularApiName("Product")
        .pluralApiName("Products")
    ];
  }
}

export default ModelFactory.createImplementation({
  implementation: ProductModelImpl,
  dependencies: []
});
```

### Contact Submission Model (with Predefined Values)

```typescript
// extensions/contactSubmission/ContactSubmissionModel.ts
import { ModelFactory } from "webiny/api/cms/model";

export const CONTACT_SUBMISSION_MODEL_ID = "contactSubmission";

class ContactSubmissionModelImpl implements ModelFactory.Interface {
  async execute(builder: ModelFactory.Builder) {
    return [
      builder
        .public({
          modelId: CONTACT_SUBMISSION_MODEL_ID,
          name: "Contact Submission",
          group: "ungrouped"
        })
        .description("Stores contact form submissions from the website")
        .fields(fields => ({
          name: fields
            .text()
            .renderer("textInput")
            .label("Name")
            .help("Enter your full name")
            .required("Name is required")
            .minLength(2)
            .maxLength(100),
          email: fields
            .text()
            .renderer("textInput")
            .label("Email")
            .help("Enter a valid email address")
            .required("Email is required")
            .email(),
          message: fields
            .longText()
            .renderer("textarea")
            .label("Message")
            .help("Enter your message...")
            .required("Message is required")
            .minLength(10)
            .maxLength(1000),
          emailType: fields
            .text()
            .renderer("radioButtons")
            .label("Email Type")
            .help("Automatically classified as Work or Personal")
            .predefinedValues([
              { label: "Work", value: "work" },
              { label: "Personal", value: "personal" }
            ])
        }))
        .layout([["name", "email"], ["message"], ["emailType"]])
        .titleFieldId("name")
        .descriptionFieldId("message")
        .singularApiName("ContactSubmission")
        .pluralApiName("ContactSubmissions")
    ];
  }
}

export default ModelFactory.createImplementation({
  implementation: ContactSubmissionModelImpl,
  dependencies: []
});
```

## Quick Reference

```
Import:       import { ModelFactory } from "webiny/api/cms/model";
Interface:    ModelFactory.Interface
Builder:      ModelFactory.Builder
Export:       export default ModelFactory.createImplementation({ implementation, dependencies })
Register:     <Api.Extension src={"/extensions/MyModel.ts"} />
Deploy:       yarn webiny deploy api  (or use watch mode)
```

## Related Skills

- `webiny-dependency-injection` -- The `createImplementation` pattern used here
- `webiny-sdk` -- Query and write data to your models from external apps
