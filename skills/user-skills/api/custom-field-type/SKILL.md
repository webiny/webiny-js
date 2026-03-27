---
name: webiny-api-cms-custom-field-type
context: webiny-extensions
description: >
  How to implement a custom CMS field type that integrates with the model builder's
  fluent API. Covers extending DataFieldBuilder, composing validator interfaces,
  creating a FieldTypeFactory, registering via DI, and module augmentation for
  TypeScript autocomplete on the fields() registry.
---

# Custom CMS Field Type

## TL;DR

A custom field type is a class that extends `DataFieldBuilder<"yourType">`, paired with a factory class implementing `FieldType.Factory`. Register the factory with `container.register(YourFieldType)`. Add a module augmentation on `"webiny/api/cms/model"` so the `fields` registry method gets TypeScript autocomplete.

## When to Use This

Use a custom field type when:

- You need a field with a storage format or validation logic not covered by the built-in types (`text`, `number`, `boolean`, `datetime`, `file`, `ref`, `object`, `richText`, `longText`, `json`, `dynamicZone`)
- You want to expose a fluent builder API (e.g., `fields.slug()`, `fields.color()`) in `ModelFactory` implementations

## Field Type Structure

A custom field type consists of three parts:

1. **Builder interface** — extends `DataFieldBuilder<"type">` plus `FieldTypeValidator.*` types
2. **Builder class** — implements the interface, calls `this.validation()` for each validator
3. **Factory class** — implements `FieldType.Factory`, creates builder instances

As a standalone extension (not part of a larger feature), the directory layout is:

```
extensions/
└── SlugFieldType/
    ├── SlugFieldType.ts     # builder interface, builder class, factory class
    └── feature.ts           # createFeature — registers the factory into the DI container
```

`feature.ts`:

```ts
// extensions/SlugFieldType/feature.ts
import { createFeature } from "webiny/api";
import { SlugFieldType } from "./SlugFieldType.js";

export const SlugFieldTypeFeature = createFeature({
  name: "SlugFieldType",
  register(container) {
    container.register(SlugFieldType);
  }
});
```

Register in the API entry point:

```ts
// api/Extension.ts
import { createFeature } from "webiny/api";
import { SlugFieldTypeFeature } from "~/extensions/SlugFieldType/feature.js";

export const Extension = createFeature({
  name: "MyExtension",
  register(container) {
    SlugFieldTypeFeature.register(container);
  }
});
```

## Complete Example

```ts
// extensions/SlugFieldType/SlugFieldType.ts
import { DataFieldBuilder, FieldType } from "webiny/api/cms/model";
import type { FieldTypeValidator } from "webiny/api/cms/model";

// 1. Builder interface — extends DataFieldBuilder + desired FieldTypeValidator types
export interface ISlugFieldBuilder
  extends
    DataFieldBuilder<"slug">,
    FieldTypeValidator.Required,
    FieldTypeValidator.Pattern,
    FieldTypeValidator.Unique {}

// 2. Module augmentation — adds fields.slug() to the registry
declare module "webiny/api/cms/model" {
  interface IFieldBuilderRegistry {
    slug(): ISlugFieldBuilder;
  }

  interface IFieldRendererRegistry {
    myCustomRenderer: {
      fieldType: "text" | "number";
      settings: undefined;
    };
  }
}

// 3. Builder class — implements each validator method via this.validation()
class SlugFieldBuilder extends DataFieldBuilder<"slug"> implements ISlugFieldBuilder {
  constructor() {
    super("slug");
  }

  required(message?: string): this {
    return this.validation({
      name: "required",
      message: message || "Value is required.",
      settings: {}
    });
  }

  pattern(regex: string, flags = "", message?: string): this {
    return this.validation({
      name: "pattern",
      message: message || "Invalid value.",
      settings: { preset: "custom", regex, flags }
    });
  }

  unique(message?: string): this {
    return this.validation({
      name: "unique",
      message: message || "Value must be unique.",
      settings: {}
    });
  }
}

// 4. Factory class — implements FieldType.Factory
class SlugFieldTypeFactory implements FieldType.Factory {
  readonly type = "slug";

  create(): ISlugFieldBuilder {
    return new SlugFieldBuilder();
  }
}

// 5. Export as a FieldType implementation
export const SlugFieldType = FieldType.createImplementation({
  implementation: SlugFieldTypeFactory,
  dependencies: []
});
```

## Using the Custom Field in a Model

After registration, `fields.slug()` is available in any `ModelFactory` implementation:

```ts
import { ModelFactory } from "webiny/api/cms/model";

class ProductModelImpl implements ModelFactory.Interface {
  async execute(builder: ModelFactory.Builder) {
    return [
      builder
        .public({ modelId: "product", name: "Product", group: "ungrouped" })
        .fields(fields => ({
          name: fields.text().label("Name").required(),
          slug: fields
            .slug()
            .label("Slug")
            .required("Slug is required.")
            .unique()
            .pattern("^[a-z0-9-]+$", "", "Only lowercase letters, numbers, and hyphens.")
        }))
        .layout([["name", "slug"]])
        .titleFieldId("name")
        .singularApiName("Product")
        .pluralApiName("Products")
    ];
  }
}
```

## DataFieldBuilder API

All methods return `this` for chaining.

| Method                      | Description                                   |
| --------------------------- | --------------------------------------------- |
| `label(text)`               | Field label shown in the Admin editor         |
| `help(text)`                | Help text shown below the field               |
| `description(text)`         | Field description                             |
| `fieldId(id)`               | Override the auto-derived field ID            |
| `storageId(id)`             | Override the storage identifier               |
| `placeholder(text)`         | Placeholder text for the input                |
| `defaultValue(value)`       | Default value for new entries                 |
| `list()`                    | Make the field accept multiple values (array) |
| `listMinLength(n, msg?)`    | Minimum number of list items                  |
| `listMaxLength(n, msg?)`    | Maximum number of list items                  |
| `tags(tags)`                | Arbitrary tags for filtering/querying         |
| `renderer(name, settings?)` | Set the Admin UI renderer                     |
| `settings(settings)`        | Set arbitrary field settings                  |

### Protected Methods (for use inside validator implementations only)

| Method                      | Description                                                        |
| --------------------------- | ------------------------------------------------------------------ |
| `this.validation(rule)`     | Append a `CmsModelFieldValidation` to the field's validation array |
| `this.listValidation(rule)` | Append a `CmsModelFieldValidation` to the list validation array    |

A `CmsModelFieldValidation` has the shape:

```ts
{
  name: string; // validator name (e.g., "required", "minLength", "pattern")
  message: string; // error message shown to the user
  settings: Record<string, any>; // validator-specific config
}
```

## Available Validators

Import via `import type { FieldTypeValidator } from "webiny/api/cms/model"` and extend your builder interface with them. Each type adds one method to your interface:

| Type                                | Method signature                   |
| ----------------------------------- | ---------------------------------- |
| `FieldTypeValidator.Required`       | `required(message?)`               |
| `FieldTypeValidator.Unique`         | `unique(message?)`                 |
| `FieldTypeValidator.MinLength`      | `minLength(value, message?)`       |
| `FieldTypeValidator.MaxLength`      | `maxLength(value, message?)`       |
| `FieldTypeValidator.Pattern`        | `pattern(regex, flags?, message?)` |
| `FieldTypeValidator.Email`          | `email(message?)`                  |
| `FieldTypeValidator.Url`            | `url(message?)`                    |
| `FieldTypeValidator.LowerCase`      | `lowerCase(message?)`              |
| `FieldTypeValidator.UpperCase`      | `upperCase(message?)`              |
| `FieldTypeValidator.LowerCaseSpace` | `lowerCaseSpace(message?)`         |
| `FieldTypeValidator.UpperCaseSpace` | `upperCaseSpace(message?)`         |
| `FieldTypeValidator.Gte`            | `gte(value, message?)`             |
| `FieldTypeValidator.Lte`            | `lte(value, message?)`             |
| `FieldTypeValidator.DateGte`        | `dateGte(value, message?)`         |
| `FieldTypeValidator.DateLte`        | `dateLte(value, message?)`         |
| `FieldTypeValidator.ListMinLength`  | `listMinLength(value, message?)`   |
| `FieldTypeValidator.ListMaxLength`  | `listMaxLength(value, message?)`   |

When implementing a validator method in the builder class, call `this.validation()` with the appropriate `name` and `settings`. For `ListMinLength`/`ListMaxLength`, call `this.listValidation()` instead. The `settings` shapes:

| Validator                    | `name`                        | `settings`                                                                   |
| ---------------------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| Required, Unique             | `"required"` / `"unique"`     | `{}`                                                                         |
| MinLength, MaxLength         | `"minLength"` / `"maxLength"` | `{ value: String(n) }`                                                       |
| Gte, Lte                     | `"gte"` / `"lte"`             | `{ value: String(n) }`                                                       |
| DateGte, DateLte             | `"dateGte"` / `"dateLte"`     | `{ value }`                                                                  |
| Pattern                      | `"pattern"`                   | `{ preset: "custom", regex, flags }`                                         |
| Email                        | `"pattern"`                   | `{ preset: "email", regex: null, flags: null }`                              |
| Url                          | `"pattern"`                   | `{ preset: "url", regex: null, flags: null }`                                |
| LowerCase / UpperCase / etc. | `"pattern"`                   | `{ preset: "lowerCase"` / `"upperCase"` / etc., `regex: null, flags: null }` |

## Key Rules

1. **`type` string must be unique** — the factory's `readonly type` must not collide with any built-in type (`text`, `number`, `boolean`, `datetime`, `file`, `ref`, `object`, `richText`, `longText`, `json`, `dynamicZone`) or other custom types.
2. **Module augmentation target** — augment `"webiny/api/cms/model"` using `namespace FieldBuilderRegistry { interface Interface { yourType(): IYourFieldBuilder; } }`.
3. **`validation()` is protected** — never call it from outside the builder class. Expose validators as named methods on the interface (e.g., `required()`, `minLength()`).
4. **`dependencies: []`** — field type factories have no DI dependencies; always pass an empty array.
5. **Registration order** — register custom `FieldType` implementations before `FieldBuilderRegistry` is resolved (i.e., in the same `register()` call or before it runs). The registry collects all `FieldType` instances at construction time.

## Related Skills

- **webiny-api-cms-content-models** — Using the model builder's fluent API to define CMS models
- **webiny-api-cms-catalog** — Full catalog of CMS abstractions including `ModelFactory`, `FieldType`, `DataFieldBuilder`
- **webiny-dependency-injection** — The `createImplementation` pattern and DI scoping
