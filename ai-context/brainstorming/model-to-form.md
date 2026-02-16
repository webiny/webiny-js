# CMS Model → FormModel: Brainstorming

## Problem

We have two parallel field definition systems:

1. **CMS ModelBuilder** (API side) — defines content model fields via a fluent builder, produces `CmsModelField[]` JSON. This is the source of truth for what a content model looks like.
2. **FormModel** (client side, new) — defines form fields via a fluent builder, manages state, validation, and exposes a VM for rendering.

When the admin UI needs to render a form for a CMS content entry, it currently hand-builds React forms with `<Bind>` components. With the new FormModel, we want to **automatically generate a FormModel from a CMS model's field definitions** — so the Presenter gets a fully configured form without manually defining every field.

## Input: What We Have

A CMS model's fields come from the API as `CmsModelField[]`. Example (from File Manager model):

```json
{
  "id": "name",
  "fieldId": "name",
  "type": "text",
  "label": "Name",
  "list": false,
  "validation": [{ "name": "required", "message": "Value is required." }],
  "listValidation": [],
  "predefinedValues": { "enabled": false, "values": [] },
  "help": null,
  "placeholder": null,
  "description": null,
  "note": null,
  "renderer": { "name": "text-input" },
  "settings": {},
  "tags": []
}
```

Key properties per field:
- `type` — maps to a FormModel field type (`text`, `number`, `boolean`, `datetime`, `file`, `rich-text`, `object`, `ref`, `dynamicZone`, `json`, `long-text`, `searchable-json`)
- `label`, `help`, `placeholder`, `description`, `note` — display metadata
- `list` — if `true`, the field is a list (maps to `.list()`)
- `validation[]` — array of `{ name, message, settings }` validators
- `listValidation[]` — validators for the list itself
- `predefinedValues` — if `enabled`, maps to `.options()`
- `renderer` — maps to `.renderer()`
- `settings.fields` — nested `CmsModelField[]` for object fields
- `settings.defaultValue` — default value
- `tags` — metadata tags

## Output: What We Want

A `FormModel` instance with all fields configured — types, labels, validation, options, nesting, lists — ready to `setData()` and render.

## Approach: `createFormFromCmsModel(fields: CmsModelField[]): FormModel`

A function that takes the CMS field definitions and produces a FormModel. The mapping is mechanical — each `CmsModelField` property has a direct counterpart in the FormModel builder API.

### Type Mapping

| CmsModelField.type | FormModel field | Notes |
|---|---|---|
| `text` | `fields.text()` | |
| `long-text` | `fields.text()` | `.renderer("textarea")` by default |
| `number` | `fields.number()` | |
| `boolean` | `fields.boolean()` | |
| `datetime` | `fields.datetime()` | `settings.type` determines subtype |
| `file` | `fields.file()` | `settings.imagesOnly` flag |
| `rich-text` | `fields.richText()` | |
| `object` | `fields.object()` | Recurse into `settings.fields` |
| `ref` | `fields.ref()` | `settings.models` for referenced models |
| `dynamicZone` | `fields.dynamicZone()` | `settings.templates` |
| `json` | `fields.json()` | |
| `searchable-json` | `fields.json()` | Same rendering, different storage concern |

### Metadata Mapping

Straightforward 1:1 — each `CmsModelField` property maps to a builder method:

```
label         → .label(field.label)
help          → .help(field.help)              // if non-null
placeholder   → .placeholder(field.placeholder) // if non-null
description   → .description(field.description) // if non-null
note          → .note(field.note)              // if non-null
renderer      → .renderer(field.renderer.name)  // if non-null
tags          → .tags(field.tags)
list          → .list()                         // if true
defaultValue  → .defaultValue(field.settings.defaultValue) // if defined
```

### Validation Mapping

CMS validators are `{ name, message, settings }` objects. These need to be converted to zod schemas on the FormModel side.

```ts
function cmsValidatorToZod(validator: CmsModelFieldValidation, baseSchema: ZodSchema): ZodSchema {
    switch (validator.name) {
        case "required":
            // For strings: z.string().min(1, message)
            // For numbers: z.number({ required_error: message })
            // For arrays (list fields): z.array().min(1, message)
            break;
        case "minLength":
            return baseSchema.min(Number(validator.settings.value), validator.message);
        case "maxLength":
            return baseSchema.max(Number(validator.settings.value), validator.message);
        case "pattern":
            if (validator.settings.preset === "email") {
                return baseSchema.email(validator.message);
            }
            if (validator.settings.preset === "url") {
                return baseSchema.url(validator.message);
            }
            if (validator.settings.regex) {
                return baseSchema.regex(
                    new RegExp(validator.settings.regex, validator.settings.flags),
                    validator.message
                );
            }
            break;
        case "gte":
            return baseSchema.gte(Number(validator.settings.value), validator.message);
        case "lte":
            return baseSchema.lte(Number(validator.settings.value), validator.message);
        // dateGte, dateLte — handled similarly
    }
}
```

The function chains validators onto the base zod schema for the field type:

```ts
function buildFieldSchema(field: CmsModelField): ZodSchema {
    let schema = baseSchemaForType(field.type); // z.string(), z.number(), etc.

    for (const v of field.validation) {
        schema = cmsValidatorToZod(v, schema);
    }

    return schema;
}
```

For list fields, `listValidation` maps to `.listSchema()`:

```ts
if (field.list) {
    let listSchema = z.array(itemSchema);
    for (const v of field.listValidation) {
        listSchema = cmsListValidatorToZod(v, listSchema);
    }
    formField.listSchema(listSchema);
}
```

### Predefined Values → Options

```ts
if (field.predefinedValues?.enabled) {
    formField.options(
        field.predefinedValues.values.map(v => ({
            label: v.label,
            value: v.value,
        }))
    );

    // If a value has `selected: true`, use it as defaultValue
    const selected = field.predefinedValues.values.find(v => v.selected);
    if (selected) {
        formField.defaultValue(selected.value);
    }
}
```

### Object Field Nesting (Recursive)

Object fields have `settings.fields: CmsModelField[]`. The conversion recurses:

```ts
function convertField(cmsField: CmsModelField): FieldBuilder {
    if (cmsField.type === "object" && cmsField.settings?.fields) {
        return fields.object()
            .label(cmsField.label)
            .fields(fields => {
                const result: Record<string, FieldBuilder> = {};
                for (const nested of cmsField.settings.fields) {
                    result[nested.fieldId] = convertField(nested);
                }
                return result;
            });
    }
    // ... other types
}
```

### Full Conversion Sketch

```ts
function createFormFromCmsFields(cmsFields: CmsModelField[]): FormModel {
    return new FormModel(fields => {
        const result: Record<string, FieldBuilder> = {};

        for (const cmsField of cmsFields) {
            result[cmsField.fieldId] = convertField(cmsField, fields);
        }

        return result;
    });
}

function convertField(cmsField: CmsModelField, fields: FieldBuilderRegistry): FieldBuilder {
    // 1. Create the right field type
    let builder = createBuilderForType(cmsField.type, fields);

    // 2. Apply metadata
    builder.label(cmsField.label);
    if (cmsField.help) builder.help(cmsField.help);
    if (cmsField.placeholder) builder.placeholder(cmsField.placeholder);
    if (cmsField.description) builder.description(cmsField.description);
    if (cmsField.note) builder.note(cmsField.note);
    if (cmsField.renderer) builder.renderer(cmsField.renderer.name);
    if (cmsField.tags?.length) builder.tags(cmsField.tags);
    if (cmsField.settings?.defaultValue !== undefined) {
        builder.defaultValue(cmsField.settings.defaultValue);
    }

    // 3. Apply list modifier
    if (cmsField.list) builder.list();

    // 4. Apply validation → zod schema
    if (cmsField.validation?.length) {
        builder.schema(buildFieldSchema(cmsField));
    }
    if (cmsField.list && cmsField.listValidation?.length) {
        builder.listSchema(buildListSchema(cmsField));
    }

    // 5. Apply predefined values → options
    if (cmsField.predefinedValues?.enabled) {
        builder.options(
            cmsField.predefinedValues.values.map(v => ({
                label: v.label,
                value: v.value,
            }))
        );
    }

    // 6. Recurse for object fields
    if (cmsField.type === "object" && cmsField.settings?.fields) {
        builder.fields(nestedFields => {
            const result: Record<string, FieldBuilder> = {};
            for (const nested of cmsField.settings.fields) {
                result[nested.fieldId] = convertField(nested, nestedFields);
            }
            return result;
        });
    }

    return builder;
}
```

## File Manager Example: End to End

Given the File Manager model (`file.model.ts` → `file.fields.json`), the conversion would produce a FormModel equivalent to:

```ts
new FormModel(fields => ({
    name: fields.text()
        .label("Name")
        .schema(z.string().min(1, "Value is required.")),

    key: fields.text()
        .label("Key")
        .schema(z.string().min(1, "Value is required.")),

    type: fields.text()
        .label("Type")
        .schema(z.string().min(1, "Value is required.")),

    size: fields.number()
        .label("Size")
        .schema(z.number({ required_error: "Value is required." })),

    metadata: fields.object()
        .label("Metadata")
        .renderer("hidden")
        .fields(fields => ({
            image: fields.object()
                .label("Image")
                .fields(fields => ({
                    width: fields.number().label("Width"),
                    height: fields.number().label("Height"),
                    format: fields.text().label("Format"),
                    orientation: fields.number().label("Orientation"),
                })),
            exif: fields.json().label("EXIF Data"),
            iptc: fields.json().label("IPTC Data"),
        })),

    tags: fields.text()
        .label("Tags")
        .list()
        .tags(["$bulk-edit"])
        .schema(z.string().min(1, "Value is required.")),

    accessControl: fields.object()
        .label("Access Control")
        .tags(["$bulk-edit"])
        .fields(fields => ({
            type: fields.text()
                .label("Type")
                .options([
                    { label: "Public", value: "public" },
                    { label: "Private", value: "private-authenticated" },
                ])
                .defaultValue("public"),
        })),
}))
```

## Presenter Lifecycle

The CMS model comes from an async use case (`GetModel`), so the FormModel can't be built in the constructor. The Presenter uses an `init()` method:

```ts
class EntryPresenter {
    private form: FormModel;
    private entry: CmsEntry | null = null;

    constructor(
        private getModel: GetModel.Interface,
        private repository: EntryRepository.Interface,
        private modifiers: FormModifier.Interface[]
    ) {}

    async init(modelId: string, entryId?: string) {
        // 1. Load model (and entry if editing)
        const model = await this.getModel.execute(modelId);

        // 2. Build form from CMS model fields
        this.form = createFormFromCmsFields(model.fields);

        // 3. Apply modifiers — they can add fields, visibility rules, etc.
        for (const modifier of this.modifiers) {
            modifier.modify(this.form, { entry: null, model });
        }

        // 4. Hydrate with entry data (if editing existing entry)
        if (entryId) {
            this.entry = await this.repository.getEntry(entryId);
            this.form.setData(this.entry.values);
        }
        // For new entries: form starts with default values, no setData()
    }

    async save() {
        const values = await this.form.submit();
        if (this.entry) {
            await this.repository.updateEntry(this.entry.id, values);
        } else {
            this.entry = await this.repository.createEntry(values);
        }
    }

    get vm() {
        return {
            entryId: this.entry?.id,
            status: this.entry?.status,
            form: this.form.vm,
            // ...
        };
    }
}
```

**Order matters:** build form → apply modifiers → hydrate data. Modifiers might add fields with default values that `setData()` needs to fill in for missing data.

**Modifiers** are injected via DI. The Presenter calls them explicitly, passing both the form and a context object. Modifiers don't need DI indirection to reach the entry — they get what they need as arguments:

```ts
interface FormModifier {
    modify(form: FormModel, context: { entry: CmsEntry | null; model: CmsModel }): void;
}
```

## Where Does This Live?

Two options:

**A) In the FormModel package** — `createFormFromCmsFields()` as a utility. This means the FormModel package depends on the CMS field type definitions (or at least the `CmsModelField` interface).

**B) In a CMS-specific package** — e.g., `@webiny/app-headless-cms` has a utility that imports FormModel and CMS types. This keeps FormModel generic and the CMS-specific glue in the CMS package.

**B is cleaner** — FormModel stays domain-agnostic. The CMS package owns the bridge.

## Partial Form Generation

`createFormFromCmsFields` accepts an optional field ID filter to build a form with a subset of fields:

```ts
// Full form — all fields
const fullForm = createFormFromCmsFields(model.fields);

// Partial form — only specific fields
const quickEditForm = createFormFromCmsFields(model.fields, {
    include: ["name", "tags", "accessControl"]
});
```

This covers "quick edit" dialogs, bulk edit panels, and any case where you need a lighter form. The Presenter picks which fields to include; the conversion handles the rest.

## Modifying the Generated FormModel

The base FormModel is generated from the CMS model definition (which comes from the API and already includes API-side decorator modifications). Client-side modifiers are registered via DI and called by the Presenter during `init()`:

```ts
class AddVisibilityRulesModifier implements FormModifier.Interface {
    modify(form: FormModel, context: { entry: CmsEntry | null; model: CmsModel }) {
        // Add presentation-only concerns
        form.field("accessControl").visible(() => userCanManageAccess);

        // Add field that doesn't exist in the CMS model
        form.addField("internalNote", fields => fields.text().label("Internal Note"));
    }
}
```

API-side field additions flow through automatically (the client regenerates from `model.fields`). Client-side modifiers are for presentation-only concerns that don't exist in the CMS model.

## Dynamic Zone Conversion

No dedicated `dynamicZone` field type. CMS dynamic zone fields convert to `object().list().templates(...)`:

```ts
// CMS field type "dynamicZone" with settings.templates
// converts to:

content: fields.object()
    .label("Content Blocks")
    .list()
    .templates(cmsField.settings.templates.map(t => ({
        id: t.id,
        name: t.name,
        fields: fields => convertFields(t.fields, fields),  // recurse per template
    })))
```

The data uses `_templateId` as the discriminator, matching the existing CMS data format:

```json
[
    { "_templateId": "hero", "heading": "Welcome", "image": "..." },
    { "_templateId": "richText", "body": "Lorem ipsum..." }
]
```

The type mapping table entry:

| CmsModelField.type | FormModel field | Notes |
|---|---|---|
| `dynamicZone` | `fields.object().list().templates(...)` | Templates from `settings.templates`, `_templateId` discriminator |

## Open Questions

1. **Complex field type renderers** — `ref`, `file`, `rich-text` each need specialized renderer components with their own state (picker/search for refs, upload for files, editor for rich text). This state lives in the renderer component, not in FormModel. FormModel just holds the field value.

2. **Layout from CMS model** — CMS models have `settings.layout` (a `string[][]` grid). Once we tackle the FormModel layout system, this data could drive form layout. For now, generic top-to-bottom rendering ignores it.
