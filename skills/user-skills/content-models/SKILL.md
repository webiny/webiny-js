---
name: webiny-api-cms-content-models
context: webiny-extensions
description: >
  Creating Headless CMS content models via code using the ModelFactory pattern.
  Use this skill when the developer wants to create, modify, or understand content model
  definitions, define fields and validators, set up reference fields between models,
  configure field layouts (including nested layouts inside object or dynamicZone fields),
  pick the correct Admin UI renderer for a field type (textInput/textInputs,
  lexicalEditor/lexicalEditors, file/files, objectAccordionSingle/objectAccordionMultiple, etc.),
  or work with the ModelFactory builder API. Also covers field types
  (text, longText, number, boolean, datetime, file, ref, object, richText, dynamicZone),
  list (array) fields via .list() and the singular-vs-plural renderer rule,
  validation (required, unique, email, pattern, minLength, maxLength, gte, predefinedValues),
  single-entry (singleton) models via .singleEntry(), and model/field tags via .tags().
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
        .layout([
          /* row definitions */
        ])
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

| Method                                        | Purpose                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `.public({ modelId, name, group })`           | Creates a public model (accessible via Read API). `modelId` is the internal DB identifier. `group` organizes it in the Admin sidebar. |
| `.description("...")`                         | Model description shown in Admin UI                                                                                                   |
| `.fields(fields => ({ ... }))`                | Define all fields using the fluent field builder                                                                                      |
| `.layout([["field1", "field2"], ["field3"]])` | Arrange fields in rows in the Admin editor. Each inner array is one row.                                                              |
| `.titleFieldId("name")`                       | Which field to use as the entry's display title                                                                                       |
| `.descriptionFieldId("message")`              | Which field to use as the entry's description                                                                                         |
| `.singularApiName("Product")`                 | Singular name for GraphQL queries (e.g., `getProduct`)                                                                                |
| `.pluralApiName("Products")`                  | Plural name for GraphQL queries (e.g., `listProducts`)                                                                                |
| `.singleEntry()`                              | Makes the model a singleton (only one entry can exist). Automatically adds the `"singleEntry"` tag.                                   |
| `.tags(["tag1", "tag2"])`                     | Assign custom tags to the model. The tag `"type:model"` is always added automatically. Duplicates are removed.                        |

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

```typescript
.fields((fields) => ({
  blocks: fields
    .dynamicZone()
    .label("Content blocks")
    .template("hero", {
      name: "Hero",
      gqlTypeName: "HeroBlock",
      fields: (t) => ({
        heading: t.text().renderer("textInput").label("Heading"),
        image:   t.file().renderer("file").label("Image")
      }),
      layout: [
        ["heading"],          // layout inside the "hero" template only
        ["image"]
      ]
    })
    .template("quote", {
      name: "Quote",
      gqlTypeName: "QuoteBlock",
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

## Field Types

The renderer passed to `.renderer("...")` **must** come from this table. The name is a
camelCase key that the framework maps internally to the real frontend renderer. Using a
made-up name (e.g. `"fileInput"`, `"lexicalTextInput"`, `"objectInput"`) will silently
misbehave in the Admin UI — the field will render with a fallback or not save values.

The authoritative source for this list is
`@webiny/api-headless-cms/features/modelBuilder/fields/DataFieldBuilder.d.ts` (in the
project's `node_modules`) — if you're unsure, grep there first.

| Builder Method         | Description                              | Renderer (single)            | Renderer when `.list()` (multi) |
| ---------------------- | ---------------------------------------- | ---------------------------- | ------------------------------- |
| `fields.text()`        | Single-line text                         | `"textInput"`                | `"textInputs"`                  |
| `fields.text()` + tags | Tag-style text (predefinedValues, etc.)  | `"radioButtons"`, `"dropdown"`, `"tags"`, `"checkboxes"` | same (these don't pluralize) |
| `fields.longText()`    | Multi-line text                          | `"textarea"`                 | `"textareas"`                   |
| `fields.richText()`    | Rich text (Lexical)                      | `"lexicalEditor"`            | `"lexicalEditors"`              |
| `fields.number()`      | Numeric value                            | `"numberInput"`              | `"numberInputs"`                |
| `fields.boolean()`     | True/false toggle                        | `"switch"`                   | *(boolean fields don't list)*   |
| `fields.datetime()`    | Date/time picker                         | `"dateTimeInput"`            | `"dateTimeInputs"`              |
| `fields.file()`        | File/image attachment                    | `"file"`                     | `"files"`                       |
| `fields.ref()`         | Reference to another model (single)      | `"refDialogSingle"`, `"refAutocompleteSingle"`, `"refRadioButtons"` | — |
| `fields.ref().list()`  | Reference to another model (multiple)    | —                            | `"refDialogMultiple"`, `"refAutocompleteMultiple"`, `"refCheckboxes"` |
| `fields.object()`      | Nested object with sub-fields            | `"objectAccordionSingle"`    | `"objectAccordionMultiple"`     |
| `fields.dynamicZone()` | Dynamic zone (choose-one-of-N templates) | `"dynamicZone"`              | *(implicitly a list; see below)* |

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
  .renderer("textInputs")     // plural, because .list() is chained
  .label("Tags")
```

**Wrong** — singular renderer on a list field (this is the pattern that breaks silently):

```typescript
tags: fields
  .text()
  .list()
  .renderer("textInput")      // WRONG: should be "textInputs"
  .label("Tags")
```

The same rule applies to every field type that has both variants:
`richText().list()` → `"lexicalEditors"`, `file().list()` → `"files"`,
`longText().list()` → `"textareas"`, `number().list()` → `"numberInputs"`,
`object().list()` → `"objectAccordionMultiple"`, and so on.

For `ref()` fields the pluralization rule is the same but the singular/multiple renderers
have distinct names (e.g. `refDialogSingle` → `refDialogMultiple`) — see the table.

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

| Method                          | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `.renderer("rendererName")`     | Set the Admin UI renderer                          |
| `.label("Display Name")`        | Field label in the editor                          |
| `.help("Helper text")`          | Helper text shown below the field                  |
| `.list()`                       | Make the field accept multiple values (arrays)     |
| `.models([{ modelId: "..." }])` | For `ref()` fields: which models can be referenced |
| `.tags(["tag1"])`               | Assign tags to a field (e.g., `"$bulk-edit"`)      |

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
