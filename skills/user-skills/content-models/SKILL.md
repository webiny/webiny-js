---
name: webiny-api-cms-content-models
context: webiny-extensions
description: >
  Creating Headless CMS content models via code using the ModelFactory pattern.
  Use this skill when the developer wants to create, modify, or understand content model
  definitions, define fields and validators, set up reference fields between models,
  configure field layouts, or work with the ModelFactory builder API. Also covers field types
  (text, number, boolean, datetime, file, ref, object, richText) and validation (required,
  unique, email, pattern, minLength, maxLength, gte, predefinedValues),
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

## Field Types

| Builder Method      | Description                   | Common Renderers                             |
| ------------------- | ----------------------------- | -------------------------------------------- |
| `fields.text()`     | Single-line text              | `"textInput"`                                |
| `fields.longText()` | Multi-line text               | `"textarea"`                                 |
| `fields.richText()` | Rich text (Lexical)           | `"lexicalTextInput"`                         |
| `fields.number()`   | Numeric value                 | `"numberInput"`                              |
| `fields.boolean()`  | True/false toggle             | `"boolean"`                                  |
| `fields.datetime()` | Date/time picker              | `"dateTimeInput"`                            |
| `fields.file()`     | File/image attachment         | `"fileInput"`                                |
| `fields.ref()`      | Reference to another model    | `"refDialogSingle"`, `"refAdvancedMultiple"` |
| `fields.object()`   | Nested object with sub-fields | `"objectInput"`                              |

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
