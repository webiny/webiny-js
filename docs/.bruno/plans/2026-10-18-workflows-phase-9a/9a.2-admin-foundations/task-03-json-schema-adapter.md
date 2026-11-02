### Task 3: JSON-schema adapter and validator (`app-admin`)

R271, R274, R276 (the `{Label} is required.` text); D66, D67 (superseded: no secret fields), D168; A97; Review Focus 4 of this plan. Spec 13.2 (`app-admin/src/features/formModel` adapter), design `answers.md` QBZ-40 (the number example `Enter a number from 1 to 120.`). Every Global Constraint of 8a, 8b and 9a applies; the admin code style (`ai-context/code-style/*.md`, read before writing) binds every new file: one exported function per file, one named import per line, no nested call arguments, no multiline ternaries, comments end with a period.

An automation's settings form must not be hand-written per automation: its `settingsSchema` arrives as JSON schema (`listAutomationDefinitions`, produced by `z.toJSONSchema` with `io: "input"`, so a field with a `.default()` is not in `required`). This task adds the generic converter in `@webiny/app-admin` and nothing else; Task 12 (the automation step form) calls it, and Task 11 supplies the renderer the `team` hint maps to.

- **Fields (R271):** `buildFieldsFromJsonSchema(schema, registry, options)` walks the properties of an object schema, in order, and returns `Record<string, IFieldBuilder>` (the shape `IFormModelConfig.fields` returns). A schema that is not an object returns `{}`.
  - `string` is a `text` field (`textInput`); `ui: "textarea"` makes it `textarea`; another `ui` hint uses `options.uiRenderers[hint]` when that entry is a string (a hint with no entry, `user` in 9a, or one named like an object prototype member such as `constructor`, stays a plain text input).
  - `string` or `number`/`integer` with an `enum` of values of that type is the `select` renderer (`text().options(...)` or `number().options(...)`, option label `String(value)`); an enum of mixed or wrong-typed values is a JSON text field, and an empty `enum` list is ignored (a plain string or number).
  - `number`/`integer` is a `number` field (`numberInput`). Bounds and integer go through `.schema(z.number()...)`: `integer` is `.int()`, `minimum`/`maximum`/`exclusiveMinimum`/`exclusiveMaximum` are `.min`/`.max`/`.gt`/`.lt`; with both inclusive bounds the message is `Enter a number from {min} to {max}.` (QBZ-40); a single inclusive bound is `Enter a number of at least {min}.` / `Enter a number of at most {max}.`, `integer` is `Enter a whole number.` (Q45); exclusive bounds keep zod's own message (see Contract notes). No bound and not `integer` means no `.schema()`.
  - `boolean` is a `boolean` field (`switch`).
  - `object` with `properties` is `object().fields(...)`, the nested properties built by the same function; an array of `object` with `properties` is `object().list().fields(...)` (`objectAccordionMultiple`).
  - an array of strings (no `enum` on the items) is `text().list()` with the `tags` renderer.
  - anything else (no `type`, a list of types, `anyOf`, `const`, `$ref`, an object without `properties`, an array of numbers, a value that is not a schema object) is a JSON text field: `text()` with the `codeEditor` renderer (`{ language: "json" }`) and a `.schema(z.string().refine(..., "Enter valid JSON."))` (Q45) that accepts blank text (it means "not set", and `formDataToJsonSchemaValue` leaves it out; a required field still fails on `""` through the required check) and text that parses as JSON. List items never take a `ui` hint (an array of strings is always the `tags` list).
  - `title` is the label (the property key when there is none, `webhookUrl` stays `webhookUrl`), `description` is the help text, `default` is the `defaultValue` (stringified for a JSON field; the object kinds take their defaults through `jsonSchemaValueToFormData`).
  - `required` (the parent object's list) calls `.required("{Label} is required.")` unless the property has a `default`; a switch and a nested object are never marked required (a switch always has a value; a nested object is required through its own properties). A `required` that is not a list is ignored.
- **Values (R271):** the form holds the JSON text for a JSON field, so the stored value and the form data differ, and two pure functions convert.
  - `jsonSchemaValueToFormData(schema, value)` returns data for every property: the stored value, else the schema `default`, else `null` (`[]` for a list; a nested object and each list item convert recursively; a JSON field becomes `JSON.stringify(value, null, 2)`). A value that is not an object counts as `{}`; a stored non-list where a list belongs counts as `[]`.
  - `formDataToJsonSchemaValue(schema, data)` is the inverse: an empty scalar (`null`, `undefined`, `""`) is left out, a number `0` and `false` are kept, an empty list or nested object is left out unless the property is in `required`, JSON text is parsed (blank text is left out; text that does not parse stays as typed, the field's own check reports it before a save).
- **Validator (R271):** `createJsonSchemaValidator(schema)` rebuilds a zod schema with `z.fromJSONSchema` and returns `{ validate(value) }` with `{ valid, issues: [{ path, message }] }`. The `path` is the zod path dot-joined (`headers.0.name`, `""` for the value itself), the format of the server's settings issues (`parseAutomationSettings`). It never throws: a schema zod cannot build (`z.fromJSONSchema` throws for an unknown `type` and for an unresolved `$ref`; `null` or a string as schema also throws) gives a validator that reports every value as valid, and a throw while parsing a value is reported as valid too.
- No secret fields (D67 is superseded); no `user` picker (9b).

**Files:**
- Create: `packages/app-admin/src/features/formModel/jsonSchema/JsonSchema.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/JsonSchemaFieldOptions.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/getJsonSchemaKind.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/normalizeJsonSchema.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/buildFieldsFromJsonSchema.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/isPlainObject.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/jsonSchemaValueToFormData.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/formDataToJsonSchemaValue.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/createJsonSchemaValidator.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/getJsonSchemaKind.test.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/buildFieldsFromJsonSchema.test.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/jsonSchemaValueToFormData.test.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/formDataToJsonSchemaValue.test.ts`
- Create: `packages/app-admin/src/features/formModel/jsonSchema/createJsonSchemaValidator.test.ts`
- Modify: `packages/app-admin/src/index.ts` (FormModel section)

**Interfaces:**
- Consumes: the FormModel of `@webiny/app-admin` (`IFieldBuilderRegistry` with `text()`, `number()`, `boolean()`, `object()` from the field-type augmentations, `IFieldBuilder`, `FieldRendererName<TType, TOptions>` in `packages/app-admin/src/features/formModel/abstractions.ts`; the renderers `textInput`, `textarea`, `select`, `numberInput`, `switch`, `tags`, `codeEditor`, `objectAccordionSingle`/`objectAccordionMultiple`, registered in `packages/app-admin/src/base/Base/FieldRenderers/`), zod 4.4.3 (`z.fromJSONSchema`, `z.number()`; `packages/app-admin/package.json` already depends on it, A97), `FormModelFactory`, `FormModelFeature` and `IdentityContextFeature` for the tests (as `FormModel.test.ts` builds a form).
- Produces (R271): `JsonSchema` (and `JsonSchemaType`, `JsonSchemaEnumValue`), `JsonSchemaFieldOptions { uiRenderers: Record<string, FieldRendererName<"text", false>> }`, `buildFieldsFromJsonSchema(schema: JsonSchema, registry: IFieldBuilderRegistry, options: JsonSchemaFieldOptions): Record<string, IFieldBuilder>`, `jsonSchemaValueToFormData(schema: JsonSchema, value: unknown): Record<string, unknown>`, `formDataToJsonSchemaValue(schema: JsonSchema, data: unknown): Record<string, unknown>`, `createJsonSchemaValidator(schema: JsonSchema): JsonSchemaValidator`, `JsonSchemaValidator { validate(value: unknown): JsonSchemaValidationResult }`, `JsonSchemaValidationResult { valid: boolean; issues: JsonSchemaIssue[] }`, `JsonSchemaIssue { path: string; message: string }`; all exported from `@webiny/app-admin` (Tasks 12, 13 import them through the package root; the internal `getJsonSchemaKind` and `normalizeJsonSchema` stay unexported).

**Test runner note:** admin package, `yarn test <path>` only (no `test:os`). The tests are co-located in `src` and import `~/features/...` and relative paths; the type check of co-located tests is the package build (R243), and `yarn check:test:types -p app-admin` covers `__tests__`. The `.test.ts` files need no React.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-admin/src/features/formModel/jsonSchema/getJsonSchemaKind.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "./JsonSchema.js";
import { getJsonSchemaKind } from "./getJsonSchemaKind.js";

describe("getJsonSchemaKind", () => {
    it("maps the scalar types", () => {
        expect(getJsonSchemaKind({ type: "string" })).toBe("string");
        expect(getJsonSchemaKind({ type: "number" })).toBe("number");
        expect(getJsonSchemaKind({ type: "integer" })).toBe("number");
        expect(getJsonSchemaKind({ type: "boolean" })).toBe("boolean");
    });

    it("maps a string or number enum to enum", () => {
        expect(getJsonSchemaKind({ type: "string", enum: ["a", "b"] })).toBe("enum");
        expect(getJsonSchemaKind({ type: "integer", enum: [1, 2] })).toBe("enum");
    });

    it("falls back to json for an enum whose values do not match the type or that is empty", () => {
        expect(getJsonSchemaKind({ type: "string", enum: ["a", 1] })).toBe("json");
        expect(getJsonSchemaKind({ type: "number", enum: ["a"] })).toBe("json");
        expect(getJsonSchemaKind({ type: "string", enum: [] })).toBe("string");
    });

    it("maps an object with properties to object", () => {
        expect(getJsonSchemaKind({ type: "object", properties: {} })).toBe("object");
    });

    it("maps an array of strings to stringList and an array of objects to objectList", () => {
        expect(getJsonSchemaKind({ type: "array", items: { type: "string" } })).toBe("stringList");
        expect(
            getJsonSchemaKind({ type: "array", items: { type: "object", properties: {} } })
        ).toBe("objectList");
    });

    it("falls back to json for everything else", () => {
        const schemas: JsonSchema[] = [
            {},
            { type: "null" },
            { type: "object" },
            { type: "array" },
            { type: "array", items: { type: "number" } },
            { type: "array", items: { type: "string", enum: ["a"] } },
            { anyOf: [{ type: "string" }, { type: "null" }] },
            { const: "x" }
        ];

        for (const schema of schemas) {
            expect(getJsonSchemaKind(schema)).toBe("json");
        }
    });

    it("returns json for a value that is not a schema object", () => {
        expect(getJsonSchemaKind(null as unknown as JsonSchema)).toBe("json");
        expect(getJsonSchemaKind("string" as unknown as JsonSchema)).toBe("json");
    });
});
```

Create `packages/app-admin/src/features/formModel/jsonSchema/buildFieldsFromJsonSchema.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFeature } from "../feature.js";
import { FormModelFactory } from "../abstractions.js";
import type { IFormModel } from "../abstractions.js";
import { IdentityContextFeature } from "~/features/security/IdentityContext/feature.js";
import type { JsonSchema } from "./JsonSchema.js";
import type { JsonSchemaFieldOptions } from "./JsonSchemaFieldOptions.js";
import { buildFieldsFromJsonSchema } from "./buildFieldsFromJsonSchema.js";
import { jsonSchemaValueToFormData } from "./jsonSchemaValueToFormData.js";
import { formDataToJsonSchemaValue } from "./formDataToJsonSchemaValue.js";

const OPTIONS: JsonSchemaFieldOptions = { uiRenderers: { team: "textarea" } };

const createForm = (schema: JsonSchema, options: JsonSchemaFieldOptions = OPTIONS): IFormModel => {
    const container = new Container();
    IdentityContextFeature.register(container);
    FormModelFeature.register(container);
    return container.resolve(FormModelFactory).create({
        fields: registry => buildFieldsFromJsonSchema(schema, registry, options)
    });
};

const objectSchema = (properties: Record<string, JsonSchema>, required?: string[]): JsonSchema => {
    const schema: JsonSchema = { type: "object", properties };
    if (required) {
        schema.required = required;
    }
    return schema;
};

describe("buildFieldsFromJsonSchema", () => {
    describe("strings", () => {
        it("maps a string to a text input with the title as label and the description as help", () => {
            const form = createForm(
                objectSchema({
                    url: { type: "string", title: "URL", description: "Where to post." }
                })
            );

            const vm = form.field("url").vm;

            expect(vm.type).toBe("text");
            expect(vm.renderer).toBe("textInput");
            expect(vm.label).toBe("URL");
            expect(vm.help).toBe("Where to post.");
        });

        it("labels a property without a title with its key", () => {
            const form = createForm(objectSchema({ webhookUrl: { type: "string" } }));

            expect(form.field("webhookUrl").vm.label).toBe("webhookUrl");
            expect(form.field("webhookUrl").vm.help).toBeUndefined();
        });

        it("carries the default into the field value", () => {
            const form = createForm(objectSchema({ method: { type: "string", default: "POST" } }));

            expect(form.field("method").getValue()).toBe("POST");
        });

        it("renders the textarea hint as a textarea", () => {
            const form = createForm(objectSchema({ body: { type: "string", ui: "textarea" } }));

            expect(form.field("body").vm.renderer).toBe("textarea");
        });

        it("renders another hint with the renderer registered for it", () => {
            const form = createForm(objectSchema({ team: { type: "string", ui: "team" } }));

            expect(form.field("team").vm.renderer).toBe("textarea");
        });

        it("renders a hint with no registered renderer as a plain text input", () => {
            const form = createForm(objectSchema({ owner: { type: "string", ui: "user" } }));

            expect(form.field("owner").vm.renderer).toBe("textInput");
        });

        it("ignores a hint named like an object prototype member", () => {
            const form = createForm(objectSchema({ owner: { type: "string", ui: "constructor" } }));

            expect(form.field("owner").vm.renderer).toBe("textInput");
        });
    });

    describe("enums", () => {
        it("maps a string enum to a select with one option per value", () => {
            const form = createForm(
                objectSchema({ method: { type: "string", enum: ["GET", "POST"] } })
            );

            const vm = form.field("method").vm;

            expect(vm.renderer).toBe("select");
            expect(vm.options).toEqual([
                { label: "GET", value: "GET" },
                { label: "POST", value: "POST" }
            ]);
        });

        it("maps a number enum to a number select", () => {
            const form = createForm(objectSchema({ retries: { type: "integer", enum: [1, 3] } }));

            const vm = form.field("retries").vm;

            expect(vm.type).toBe("number");
            expect(vm.renderer).toBe("select");
            expect(vm.options).toEqual([
                { label: "1", value: 1 },
                { label: "3", value: 3 }
            ]);
        });
    });

    describe("numbers", () => {
        it("maps a number to a number input without a check when the schema has no bounds", () => {
            const form = createForm(objectSchema({ ratio: { type: "number" } }));

            expect(form.field("ratio").vm.type).toBe("number");
            expect(form.field("ratio").vm.renderer).toBe("numberInput");
            expect(form.field("ratio").config.schema).toBeUndefined();
        });

        it("checks both bounds with one message", async () => {
            const form = createForm(
                objectSchema({ timeout: { type: "integer", minimum: 1, maximum: 120 } })
            );
            const field = form.field("timeout");

            field.setValue(500);
            expect(await field.validate({ force: true })).toBe(false);
            expect(field.vm.validation.message).toBe("Enter a number from 1 to 120.");

            field.setValue(0);
            expect(await field.validate({ force: true })).toBe(false);
            expect(field.vm.validation.message).toBe("Enter a number from 1 to 120.");

            field.setValue(30);
            expect(await field.validate({ force: true })).toBe(true);
        });

        it("checks a single bound and exclusive bounds", async () => {
            const form = createForm(
                objectSchema({
                    atLeast: { type: "number", minimum: 5 },
                    atMost: { type: "number", maximum: 5 },
                    above: { type: "number", exclusiveMinimum: 5 },
                    below: { type: "number", exclusiveMaximum: 5 }
                })
            );

            form.field("atLeast").setValue(4);
            form.field("atMost").setValue(6);
            form.field("above").setValue(5);
            form.field("below").setValue(5);

            expect(await form.field("atLeast").validate({ force: true })).toBe(false);
            expect(await form.field("atMost").validate({ force: true })).toBe(false);
            expect(await form.field("above").validate({ force: true })).toBe(false);
            expect(await form.field("below").validate({ force: true })).toBe(false);

            expect(form.field("atLeast").vm.validation.message).toBe(
                "Enter a number of at least 5."
            );
            expect(form.field("atMost").vm.validation.message).toBe("Enter a number of at most 5.");

            form.field("atLeast").setValue(5);
            form.field("atMost").setValue(5);
            form.field("above").setValue(6);
            form.field("below").setValue(4);

            expect(await form.field("atLeast").validate({ force: true })).toBe(true);
            expect(await form.field("atMost").validate({ force: true })).toBe(true);
            expect(await form.field("above").validate({ force: true })).toBe(true);
            expect(await form.field("below").validate({ force: true })).toBe(true);
        });

        it("rejects a fraction for an integer", async () => {
            const form = createForm(objectSchema({ retries: { type: "integer" } }));
            const field = form.field("retries");

            field.setValue(1.5);
            expect(await field.validate({ force: true })).toBe(false);
            expect(field.vm.validation.message).toBe("Enter a whole number.");

            field.setValue(2);
            expect(await field.validate({ force: true })).toBe(true);
        });

        it("skips the check for an empty optional number", async () => {
            const form = createForm(objectSchema({ timeout: { type: "integer", minimum: 1 } }));

            expect(await form.field("timeout").validate({ force: true })).toBe(true);
        });
    });

    describe("booleans, objects and lists", () => {
        it("carries a boolean default into the field value", () => {
            const form = createForm(objectSchema({ enabled: { type: "boolean", default: true } }));

            expect(form.field("enabled").getValue()).toBe(true);
        });

        it("writes an untouched boolean without a default as false", () => {
            const schema = objectSchema({ enabled: { type: "boolean" } });
            const form = createForm(schema);

            form.setData(jsonSchemaValueToFormData(schema, {}));

            expect(formDataToJsonSchemaValue(schema, form.getData())).toEqual({ enabled: false });
        });

        it("maps a boolean to a switch", () => {
            const form = createForm(objectSchema({ enabled: { type: "boolean" } }));

            expect(form.field("enabled").vm.type).toBe("boolean");
            expect(form.field("enabled").vm.renderer).toBe("switch");
        });

        it("maps an object to an object field with the nested fields", () => {
            const form = createForm(
                objectSchema({
                    auth: objectSchema({ user: { type: "string" }, retries: { type: "integer" } })
                })
            );
            const auth = form.field("auth");

            expect(auth.vm.type).toBe("object");
            auth.setValue({ user: "ana", retries: 2 });
            expect(form.getData()).toEqual({ auth: { user: "ana", retries: 2 } });
        });

        it("maps an array of strings to a tags list", () => {
            const form = createForm(
                objectSchema({ labels: { type: "array", items: { type: "string" } } })
            );

            const vm = form.field("labels").vm;

            expect(vm.isList).toBe(true);
            expect(vm.renderer).toBe("tags");
            expect(vm.value).toEqual([]);
        });

        it("maps an array of objects to an object list", () => {
            const form = createForm(
                objectSchema({
                    headers: {
                        type: "array",
                        items: objectSchema({ name: { type: "string" }, value: { type: "string" } })
                    }
                })
            );

            form.field("headers").setValue([{ name: "X-Id", value: "1" }]);

            expect(form.field("headers").vm.isList).toBe(true);
            expect(form.getData()).toEqual({ headers: [{ name: "X-Id", value: "1" }] });
        });
    });

    describe("required", () => {
        it("marks the properties in `required` and uses the label in the message", async () => {
            const form = createForm(
                objectSchema({ url: { type: "string", title: "URL" }, note: { type: "string" } }, [
                    "url"
                ])
            );

            expect(form.field("url").vm.required).toBe(true);
            expect(form.field("note").vm.required).toBe(false);
            expect(await form.field("url").validate({ force: true })).toBe(false);
            expect(form.field("url").vm.validation.message).toBe("URL is required.");
        });

        it("does not require a property that has a default", () => {
            const form = createForm(
                objectSchema({ method: { type: "string", default: "POST" } }, ["method"])
            );

            expect(form.field("method").vm.required).toBe(false);
        });

        it("requires a number, a list and an enum", () => {
            const form = createForm(
                objectSchema(
                    {
                        timeout: { type: "number" },
                        labels: { type: "array", items: { type: "string" } },
                        method: { type: "string", enum: ["GET", "POST"] }
                    },
                    ["timeout", "labels", "method"]
                )
            );

            expect(form.field("timeout").vm.required).toBe(true);
            expect(form.field("labels").vm.required).toBe(true);
            expect(form.field("method").vm.required).toBe(true);
        });

        it("does not mark a switch or a nested object required", () => {
            const form = createForm(
                objectSchema(
                    {
                        enabled: { type: "boolean" },
                        auth: objectSchema({ user: { type: "string" } })
                    },
                    ["enabled", "auth"]
                )
            );

            expect(form.field("enabled").vm.required).toBe(false);
            expect(form.field("auth").vm.required).toBe(false);
        });

        it("marks the required properties of a nested object", () => {
            const form = createForm(
                objectSchema({ auth: objectSchema({ user: { type: "string" } }, ["user"]) })
            );

            expect(form.field("auth").vm.type).toBe("object");
            expect(form.field("auth.user").vm.required).toBe(true);
        });
    });

    describe("JSON fallback", () => {
        it("renders a schema of no supported shape as a JSON text field", () => {
            const form = createForm(objectSchema({ payload: { title: "Extra payload" } }));

            const vm = form.field("payload").vm;

            expect(vm.type).toBe("text");
            expect(vm.renderer).toBe("codeEditor");
            expect(vm.rendererSettings).toEqual({ language: "json" });
            expect(vm.label).toBe("Extra payload");
        });

        it("accepts JSON text and rejects text that does not parse", async () => {
            const form = createForm(objectSchema({ payload: {} }));
            const field = form.field("payload");

            field.setValue('{"a": 1}');
            expect(await field.validate({ force: true })).toBe(true);

            field.setValue("{a: 1");
            expect(await field.validate({ force: true })).toBe(false);
            expect(field.vm.validation.message).toBe("Enter valid JSON.");
        });

        it("accepts blank text for an optional JSON field", async () => {
            const form = createForm(objectSchema({ payload: {} }));
            const field = form.field("payload");

            field.setValue('{"a":1}');
            expect(await field.validate({ force: true })).toBe(true);

            field.setValue("");
            expect(await field.validate({ force: true })).toBe(true);

            field.setValue("   ");
            expect(await field.validate({ force: true })).toBe(true);
        });

        it("requires a JSON field in `required` and names it in the message", async () => {
            const form = createForm(objectSchema({ payload: {} }, ["payload"]));
            const field = form.field("payload");

            field.setValue('{"a":1}');
            expect(await field.validate({ force: true })).toBe(true);

            field.setValue("");
            expect(await field.validate({ force: true })).toBe(false);
            expect(field.vm.validation.message).toBe("payload is required.");
        });

        it("stringifies a default", () => {
            const form = createForm(objectSchema({ payload: { default: { a: 1 } } }));

            expect(form.field("payload").getValue()).toBe('{\n  "a": 1\n}');
        });

        it("uses it for a list of numbers and for a type list", () => {
            const form = createForm(
                objectSchema({
                    numbers: { type: "array", items: { type: "number" } },
                    anything: { anyOf: [{ type: "string" }, { type: "null" }] }
                })
            );

            expect(form.field("numbers").vm.renderer).toBe("codeEditor");
            expect(form.field("anything").vm.renderer).toBe("codeEditor");
        });
    });

    describe("odd schemas", () => {
        it("returns no fields for a schema that is not an object", () => {
            const form = createForm({ type: "string" });

            expect(form.getData()).toEqual({});
        });

        it("returns no fields for an object without properties", () => {
            const form = createForm({ type: "object" });

            expect(form.getData()).toEqual({});
        });

        it("does not crash on a property that is not a schema", () => {
            const properties = { broken: null, flag: true } as unknown as Record<
                string,
                JsonSchema
            >;

            const form = createForm({ type: "object", properties });

            expect(form.field("broken").vm.renderer).toBe("codeEditor");
            expect(form.field("flag").vm.renderer).toBe("codeEditor");
        });

        it("ignores a `required` that is not a list", () => {
            const schema = { type: "object", properties: { a: { type: "string" } }, required: "a" };

            const form = createForm(schema as unknown as JsonSchema);

            expect(form.field("a").vm.required).toBe(false);
        });
    });

    describe("with the form data conversions", () => {
        const SCHEMA = objectSchema(
            {
                url: { type: "string", title: "URL" },
                retries: { type: "integer", default: 3 },
                labels: { type: "array", items: { type: "string" } },
                payload: { title: "Extra payload" }
            },
            ["url"]
        );

        it("loads a stored value into the form and reads it back", () => {
            const form = createForm(SCHEMA);
            const stored = { url: "https://a.test", labels: ["x"], payload: { id: 1 } };

            form.setData(jsonSchemaValueToFormData(SCHEMA, stored));

            expect(form.field("payload").getValue()).toBe('{\n  "id": 1\n}');
            expect(formDataToJsonSchemaValue(SCHEMA, form.getData())).toEqual({
                url: "https://a.test",
                retries: 3,
                labels: ["x"],
                payload: { id: 1 }
            });
        });
    });
});
```

Create `packages/app-admin/src/features/formModel/jsonSchema/jsonSchemaValueToFormData.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "./JsonSchema.js";
import { jsonSchemaValueToFormData } from "./jsonSchemaValueToFormData.js";

const SCHEMA: JsonSchema = {
    type: "object",
    properties: {
        url: { type: "string" },
        method: { type: "string", enum: ["GET", "POST"], default: "POST" },
        timeout: { type: "integer" },
        enabled: { type: "boolean" },
        labels: { type: "array", items: { type: "string" } },
        auth: {
            type: "object",
            properties: { user: { type: "string" }, retries: { type: "integer", default: 3 } }
        },
        headers: {
            type: "array",
            items: {
                type: "object",
                properties: { name: { type: "string" }, value: { type: "string" } }
            }
        },
        payload: {}
    }
};

describe("jsonSchemaValueToFormData", () => {
    it("fills every property of an empty value with its default, null or an empty list", () => {
        expect(jsonSchemaValueToFormData(SCHEMA, {})).toEqual({
            url: null,
            method: "POST",
            timeout: null,
            enabled: null,
            labels: [],
            auth: { user: null, retries: 3 },
            headers: [],
            payload: null
        });
    });

    it("keeps the stored scalars, lists and nested values", () => {
        const stored = {
            url: "https://a.test",
            method: "GET",
            timeout: 30,
            enabled: false,
            labels: ["a", "b"],
            auth: { user: "ana" },
            headers: [{ name: "X-Id", value: "1" }, { name: "X-Team" }]
        };

        expect(jsonSchemaValueToFormData(SCHEMA, stored)).toEqual({
            url: "https://a.test",
            method: "GET",
            timeout: 30,
            enabled: false,
            labels: ["a", "b"],
            auth: { user: "ana", retries: 3 },
            headers: [
                { name: "X-Id", value: "1" },
                { name: "X-Team", value: null }
            ],
            payload: null
        });
    });

    it("stringifies the value of a JSON field with two spaces of indent", () => {
        const data = jsonSchemaValueToFormData(SCHEMA, { payload: { a: [1, 2] } });

        expect(data.payload).toBe('{\n  "a": [\n    1,\n    2\n  ]\n}');
    });

    it("stringifies a JSON field's default when nothing is stored", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: { payload: { default: { a: 1 } } }
        };

        expect(jsonSchemaValueToFormData(schema, {}).payload).toBe('{\n  "a": 1\n}');
    });

    it("uses a default object when the nested object is not stored", () => {
        const schema: JsonSchema = {
            type: "object",
            properties: {
                auth: {
                    type: "object",
                    properties: { user: { type: "string" } },
                    default: { user: "bot" }
                }
            }
        };

        expect(jsonSchemaValueToFormData(schema, {})).toEqual({ auth: { user: "bot" } });
    });

    it("treats a value that is not an object, or a wrong list value, as empty", () => {
        expect(jsonSchemaValueToFormData(SCHEMA, null).labels).toEqual([]);
        expect(jsonSchemaValueToFormData(SCHEMA, "text").labels).toEqual([]);
        expect(jsonSchemaValueToFormData(SCHEMA, [1]).headers).toEqual([]);
        expect(jsonSchemaValueToFormData(SCHEMA, { labels: "a", headers: "b" })).toMatchObject({
            labels: [],
            headers: []
        });
    });

    it("returns no data for a schema that is not an object", () => {
        expect(jsonSchemaValueToFormData({ type: "string" }, "x")).toEqual({});
        expect(jsonSchemaValueToFormData({}, { a: 1 })).toEqual({});
    });

    it("does not crash on a property that is not a schema", () => {
        const properties = { broken: null } as unknown as Record<string, JsonSchema>;

        expect(jsonSchemaValueToFormData({ type: "object", properties }, { broken: 1 })).toEqual({
            broken: "1"
        });
    });
});
```

Create `packages/app-admin/src/features/formModel/jsonSchema/formDataToJsonSchemaValue.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "./JsonSchema.js";
import { formDataToJsonSchemaValue } from "./formDataToJsonSchemaValue.js";
import { jsonSchemaValueToFormData } from "./jsonSchemaValueToFormData.js";

const SCHEMA: JsonSchema = {
    type: "object",
    required: ["url", "labels", "auth"],
    properties: {
        url: { type: "string" },
        note: { type: "string" },
        timeout: { type: "integer" },
        enabled: { type: "boolean" },
        labels: { type: "array", items: { type: "string" } },
        tags: { type: "array", items: { type: "string" } },
        auth: { type: "object", properties: { user: { type: "string" } } },
        extra: { type: "object", properties: { user: { type: "string" } } },
        headers: {
            type: "array",
            items: { type: "object", properties: { name: { type: "string" } } }
        },
        payload: {}
    }
};

describe("formDataToJsonSchemaValue", () => {
    it("leaves out empty scalars and optional empty lists and objects", () => {
        const data = {
            url: "",
            note: null,
            timeout: null,
            enabled: null,
            labels: [],
            tags: [],
            auth: { user: null },
            extra: { user: null },
            headers: [],
            payload: null
        };

        expect(formDataToJsonSchemaValue(SCHEMA, data)).toEqual({ labels: [], auth: {} });
    });

    it("keeps a required empty list and a required empty object", () => {
        const value = formDataToJsonSchemaValue(SCHEMA, { labels: [], auth: {} });

        expect(value).toEqual({ labels: [], auth: {} });
    });

    it("keeps values, including zero and false", () => {
        const data = {
            url: "https://a.test",
            timeout: 0,
            enabled: false,
            labels: ["a"],
            tags: ["t"],
            auth: { user: "ana" },
            extra: { user: "bo" },
            headers: [{ name: "X-Id" }, { name: "" }]
        };

        expect(formDataToJsonSchemaValue(SCHEMA, data)).toEqual({
            url: "https://a.test",
            timeout: 0,
            enabled: false,
            labels: ["a"],
            tags: ["t"],
            auth: { user: "ana" },
            extra: { user: "bo" },
            headers: [{ name: "X-Id" }, {}]
        });
    });

    it("parses the text of a JSON field", () => {
        const data = { labels: [], auth: {}, payload: '{ "a": [1, 2] }' };

        expect(formDataToJsonSchemaValue(SCHEMA, data).payload).toEqual({ a: [1, 2] });
    });

    it("parses JSON text that is a string, a number or null", () => {
        expect(formDataToJsonSchemaValue(SCHEMA, { payload: '"x"' }).payload).toBe("x");
        expect(formDataToJsonSchemaValue(SCHEMA, { payload: "12" }).payload).toBe(12);
        expect(formDataToJsonSchemaValue(SCHEMA, { payload: "null" }).payload).toBeNull();
    });

    it("keeps JSON text that does not parse as typed", () => {
        expect(formDataToJsonSchemaValue(SCHEMA, { payload: "{a: 1" }).payload).toBe("{a: 1");
    });

    it("leaves out a blank JSON text", () => {
        expect(formDataToJsonSchemaValue(SCHEMA, { payload: "  " })).not.toHaveProperty("payload");
    });

    it("treats data that is not an object as empty", () => {
        expect(formDataToJsonSchemaValue(SCHEMA, null)).toEqual({ labels: [], auth: {} });
        expect(formDataToJsonSchemaValue(SCHEMA, "x")).toEqual({ labels: [], auth: {} });
    });

    it("returns no value for a schema that is not an object", () => {
        expect(formDataToJsonSchemaValue({ type: "string" }, "x")).toEqual({});
    });

    it("is the inverse of jsonSchemaValueToFormData", () => {
        const stored = {
            url: "https://a.test",
            timeout: 30,
            enabled: true,
            labels: ["a"],
            auth: { user: "ana" },
            headers: [{ name: "X-Id" }],
            payload: { id: 1, tags: ["x"] }
        };

        const data = jsonSchemaValueToFormData(SCHEMA, stored);

        expect(formDataToJsonSchemaValue(SCHEMA, data)).toEqual(stored);
    });
});
```

Create `packages/app-admin/src/features/formModel/jsonSchema/createJsonSchemaValidator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { JsonSchema } from "./JsonSchema.js";
import { createJsonSchemaValidator } from "./createJsonSchemaValidator.js";

const SCHEMA: JsonSchema = {
    type: "object",
    required: ["url"],
    properties: {
        url: { type: "string" },
        timeout: { type: "integer", minimum: 1, maximum: 120 },
        headers: {
            type: "array",
            items: {
                type: "object",
                required: ["name"],
                properties: { name: { type: "string" } }
            }
        }
    }
};

describe("createJsonSchemaValidator", () => {
    it("reports a valid value with no issues", () => {
        const validator = createJsonSchemaValidator(SCHEMA);

        expect(validator.validate({ url: "https://a.test", timeout: 30 })).toEqual({
            valid: true,
            issues: []
        });
    });

    it("reports each issue with its dot-joined path", () => {
        const validator = createJsonSchemaValidator(SCHEMA);

        const result = validator.validate({ timeout: 500, headers: [{}] });

        expect(result.valid).toBe(false);
        const paths = result.issues.map(issue => issue.path).sort();
        expect(paths).toEqual(["headers.0.name", "timeout", "url"]);
        const timeout = result.issues.find(issue => issue.path === "timeout");
        expect(timeout?.message).toBe("Too big: expected number to be <=120");
    });

    it("gives an issue about the value itself an empty path", () => {
        const validator = createJsonSchemaValidator(SCHEMA);

        const result = validator.validate("text");

        expect(result.valid).toBe(false);
        expect(result.issues[0].path).toBe("");
    });

    it("applies the defaults of the schema", () => {
        const schema: JsonSchema = {
            type: "object",
            required: ["method"],
            properties: { method: { type: "string", default: "POST" } }
        };

        expect(createJsonSchemaValidator(schema).validate({}).valid).toBe(true);
    });

    it("reports every value as valid for a schema zod cannot build", () => {
        const schemas = [
            { type: "weird" },
            { type: "object", properties: { a: { $ref: "#/definitions/missing" } } },
            null,
            "text"
        ] as unknown as JsonSchema[];

        for (const schema of schemas) {
            const validator = createJsonSchemaValidator(schema);

            expect(validator.validate({ anything: 1 })).toEqual({ valid: true, issues: [] });
            expect(validator.validate(undefined)).toEqual({ valid: true, issues: [] });
        }
    });

    it("does not throw for a value zod cannot handle", () => {
        const validator = createJsonSchemaValidator(SCHEMA);
        const circular: Record<string, unknown> = {};
        circular.self = circular;

        expect(() => validator.validate(circular)).not.toThrow();
        expect(() => validator.validate(undefined)).not.toThrow();
        expect(() => validator.validate(BigInt(1))).not.toThrow();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-admin/src/features/formModel/jsonSchema/getJsonSchemaKind.test.ts 2>&1 | tail -30
yarn test packages/app-admin/src/features/formModel/jsonSchema/buildFieldsFromJsonSchema.test.ts 2>&1 | tail -30
yarn test packages/app-admin/src/features/formModel/jsonSchema/jsonSchemaValueToFormData.test.ts 2>&1 | tail -30
yarn test packages/app-admin/src/features/formModel/jsonSchema/formDataToJsonSchemaValue.test.ts 2>&1 | tail -30
yarn test packages/app-admin/src/features/formModel/jsonSchema/createJsonSchemaValidator.test.ts 2>&1 | tail -30
```

Expected: every file fails with `Failed to resolve import` for its module (`./getJsonSchemaKind.js`, `./buildFieldsFromJsonSchema.js`, `./jsonSchemaValueToFormData.js`, `./formDataToJsonSchemaValue.js`, `./createJsonSchemaValidator.js`); no test runs. Record the RED output.

- [ ] **Step 3: Implement**

Create the files in this order (each depends on the ones above it).

Create `packages/app-admin/src/features/formModel/jsonSchema/JsonSchema.ts`:

```ts
export type JsonSchemaType =
    | "object"
    | "array"
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "integer";

export type JsonSchemaEnumValue = string | number | boolean | null;

/*
 * The part of JSON schema the adapter reads, typed to stay assignable to zod's JSON schema type
 * (`z.fromJSONSchema` takes it). `ui` is the hint zod `.meta({ ui })` writes next to the standard
 * keywords (`textarea`, `team`, `user`); the index signature keeps every other keyword a schema
 * may carry. A schema whose `type` is anything else (a list of types, a missing type) renders as a
 * JSON text field.
 */
export interface JsonSchema {
    type?: JsonSchemaType;
    title?: string;
    description?: string;
    default?: unknown;
    enum?: JsonSchemaEnumValue[];
    properties?: Record<string, JsonSchema>;
    required?: string[];
    items?: JsonSchema;
    minimum?: number;
    maximum?: number;
    exclusiveMinimum?: number;
    exclusiveMaximum?: number;
    ui?: string;
    [keyword: string]: unknown;
}
```

Create `packages/app-admin/src/features/formModel/jsonSchema/JsonSchemaFieldOptions.ts`:

```ts
import type { FieldRendererName } from "../abstractions.js";

export interface JsonSchemaFieldOptions {
    /*
     * Renderer per `ui` hint, for a string property whose hint is not `textarea`. A hint with no
     * entry here is a plain text input.
     */
    uiRenderers: Record<string, FieldRendererName<"text", false>>;
}
```

Create `packages/app-admin/src/features/formModel/jsonSchema/getJsonSchemaKind.ts`:

```ts
import type { JsonSchema } from "./JsonSchema.js";

export type JsonSchemaKind =
    | "string"
    | "enum"
    | "number"
    | "boolean"
    | "object"
    | "stringList"
    | "objectList"
    | "json";

const isNumberType = (type: unknown): boolean => {
    return type === "number" || type === "integer";
};

const hasEnumValues = (schema: JsonSchema): boolean => {
    return Array.isArray(schema.enum) && schema.enum.length > 0;
};

const hasEnumOfType = (schema: JsonSchema, valueType: string): boolean => {
    if (!Array.isArray(schema.enum) || schema.enum.length === 0) {
        return false;
    }
    return schema.enum.every(value => typeof value === valueType);
};

const getArrayKind = (schema: JsonSchema): JsonSchemaKind => {
    const items = schema.items;
    if (!items || typeof items !== "object") {
        return "json";
    }
    if (items.type === "string" && !hasEnumValues(items)) {
        return "stringList";
    }
    if (items.type === "object" && items.properties && typeof items.properties === "object") {
        return "objectList";
    }
    return "json";
};

/*
 * How the adapter renders a property: one of the supported shapes, or `json` (a JSON text field)
 * for everything else. A schema that is not an object returns `json`, so a malformed property
 * never crashes the builder.
 */
export const getJsonSchemaKind = (schema: JsonSchema): JsonSchemaKind => {
    if (!schema || typeof schema !== "object") {
        return "json";
    }
    if (schema.type === "string") {
        if (hasEnumValues(schema)) {
            return hasEnumOfType(schema, "string") ? "enum" : "json";
        }
        return "string";
    }
    if (isNumberType(schema.type)) {
        if (hasEnumValues(schema)) {
            return hasEnumOfType(schema, "number") ? "enum" : "json";
        }
        return "number";
    }
    if (schema.type === "boolean") {
        return "boolean";
    }
    if (schema.type === "object" && schema.properties && typeof schema.properties === "object") {
        return "object";
    }
    if (schema.type === "array") {
        return getArrayKind(schema);
    }
    return "json";
};
```

Create `packages/app-admin/src/features/formModel/jsonSchema/normalizeJsonSchema.ts`:

```ts
import type { JsonSchema } from "./JsonSchema.js";

/*
 * A schema value that is not an object (a stored `null`, a boolean schema) has no keywords the
 * adapter can read, so it becomes the empty schema, which renders as a JSON text field.
 */
export const normalizeJsonSchema = (schema: unknown): JsonSchema => {
    if (typeof schema === "object" && schema !== null && !Array.isArray(schema)) {
        const normalized = schema as JsonSchema;
        return normalized;
    }
    return {};
};
```

Create `packages/app-admin/src/features/formModel/jsonSchema/buildFieldsFromJsonSchema.ts`:

```ts
import { z } from "zod";
import type { IFieldBuilder } from "../abstractions.js";
import type { IFieldBuilderRegistry } from "../abstractions.js";
import type { JsonSchema } from "./JsonSchema.js";
import type { JsonSchemaFieldOptions } from "./JsonSchemaFieldOptions.js";
import type { JsonSchemaKind } from "./getJsonSchemaKind.js";
import { getJsonSchemaKind } from "./getJsonSchemaKind.js";
import { normalizeJsonSchema } from "./normalizeJsonSchema.js";

interface PropertyParams {
    name: string;
    schema: JsonSchema;
    isRequired: boolean;
    registry: IFieldBuilderRegistry;
    options: JsonSchemaFieldOptions;
}

// A switch always has a value and a nested object is required through its own properties.
const KINDS_WITHOUT_REQUIRED: JsonSchemaKind[] = ["boolean", "object"];

// Blank text means "not set" (`formDataToJsonSchemaValue` leaves it out), so it is valid here.
const isJsonText = (value: string): boolean => {
    if (value.trim() === "") {
        return true;
    }
    try {
        JSON.parse(value);
        return true;
    } catch {
        return false;
    }
};

const createNumberSchema = (schema: JsonSchema): z.ZodTypeAny | null => {
    const { minimum, maximum, exclusiveMinimum, exclusiveMaximum } = schema;
    const hasMinimum = typeof minimum === "number";
    const hasMaximum = typeof maximum === "number";
    let numberSchema = z.number();
    let constrained = false;

    if (schema.type === "integer") {
        numberSchema = numberSchema.int("Enter a whole number.");
        constrained = true;
    }
    if (hasMinimum && hasMaximum) {
        const message = `Enter a number from ${minimum} to ${maximum}.`;
        numberSchema = numberSchema.min(minimum, message).max(maximum, message);
        constrained = true;
    } else if (hasMinimum) {
        numberSchema = numberSchema.min(minimum, `Enter a number of at least ${minimum}.`);
        constrained = true;
    } else if (hasMaximum) {
        numberSchema = numberSchema.max(maximum, `Enter a number of at most ${maximum}.`);
        constrained = true;
    }
    if (typeof exclusiveMinimum === "number") {
        numberSchema = numberSchema.gt(exclusiveMinimum);
        constrained = true;
    }
    if (typeof exclusiveMaximum === "number") {
        numberSchema = numberSchema.lt(exclusiveMaximum);
        constrained = true;
    }
    return constrained ? numberSchema : null;
};

const createEnumBuilder = (params: PropertyParams): IFieldBuilder => {
    const { schema, registry } = params;
    const values = schema.enum ?? [];
    if (schema.type === "string") {
        const stringOptions = values.map(value => ({ label: String(value), value: String(value) }));
        return registry.text().options(stringOptions);
    }
    const numberOptions = values.map(value => ({ label: String(value), value: Number(value) }));
    return registry.number().options(numberOptions);
};

const createStringBuilder = (params: PropertyParams): IFieldBuilder => {
    const { schema, registry, options } = params;
    const builder = registry.text();
    const hint = schema.ui;
    if (hint === "textarea") {
        return builder.renderer("textarea");
    }
    if (typeof hint === "string") {
        const renderer = options.uiRenderers[hint];
        if (typeof renderer === "string") {
            return builder.renderer(renderer);
        }
    }
    return builder;
};

const createNumberBuilder = (params: PropertyParams): IFieldBuilder => {
    const builder = params.registry.number();
    const numberSchema = createNumberSchema(params.schema);
    if (numberSchema) {
        builder.schema(numberSchema);
    }
    return builder;
};

const createJsonBuilder = (params: PropertyParams): IFieldBuilder => {
    const builder = params.registry.text();
    builder.renderer("codeEditor", { language: "json" });
    builder.schema(z.string().refine(isJsonText, "Enter valid JSON."));
    return builder;
};

const createObjectBuilder = (params: PropertyParams, isList: boolean): IFieldBuilder => {
    const { schema, registry, options } = params;
    const itemSchema = isList ? normalizeJsonSchema(schema.items) : schema;
    const builder = registry.object();
    if (isList) {
        builder.list();
    }
    return builder.fields(inner => buildFieldsFromJsonSchema(itemSchema, inner, options));
};

const createBuilder = (kind: JsonSchemaKind, params: PropertyParams): IFieldBuilder => {
    switch (kind) {
        case "string":
            return createStringBuilder(params);
        case "enum":
            return createEnumBuilder(params);
        case "number":
            return createNumberBuilder(params);
        case "boolean":
            return params.registry.boolean();
        case "object":
            return createObjectBuilder(params, false);
        case "stringList":
            return params.registry.text().list().renderer("tags");
        case "objectList":
            return createObjectBuilder(params, true);
        default:
            return createJsonBuilder(params);
    }
};

// Object kinds take their defaults through `jsonSchemaValueToFormData`, not the builder.
const getDefaultValue = (kind: JsonSchemaKind, schema: JsonSchema): unknown => {
    if (schema.default === undefined || kind === "object" || kind === "objectList") {
        return undefined;
    }
    if (kind === "json") {
        return JSON.stringify(schema.default, null, 2);
    }
    return schema.default;
};

const createField = (params: PropertyParams): IFieldBuilder => {
    const { name, schema, isRequired } = params;
    const kind = getJsonSchemaKind(schema);
    const label = typeof schema.title === "string" && schema.title !== "" ? schema.title : name;
    const builder = createBuilder(kind, params);

    builder.label(label);
    if (typeof schema.description === "string" && schema.description !== "") {
        builder.help(schema.description);
    }

    const defaultValue = getDefaultValue(kind, schema);
    if (defaultValue !== undefined) {
        builder.defaultValue(defaultValue);
    }

    const canBeRequired = !KINDS_WITHOUT_REQUIRED.includes(kind);
    if (isRequired && schema.default === undefined && canBeRequired) {
        builder.required(`${label} is required.`);
    }
    return builder;
};

/*
 * Builds the FormModel fields of a JSON schema's properties (R271). A schema that is not an object
 * has no fields. The `required` list of an object marks its properties required, except a
 * property with a `default`, a switch and a nested object (its own properties are required).
 */
export const buildFieldsFromJsonSchema = (
    schema: JsonSchema,
    registry: IFieldBuilderRegistry,
    options: JsonSchemaFieldOptions
): Record<string, IFieldBuilder> => {
    const fields: Record<string, IFieldBuilder> = {};
    if (getJsonSchemaKind(schema) !== "object") {
        return fields;
    }

    const requiredNames = Array.isArray(schema.required) ? schema.required : [];
    const properties = schema.properties ?? {};

    for (const [name, property] of Object.entries(properties)) {
        const propertySchema = normalizeJsonSchema(property);
        const isRequired = requiredNames.includes(name);
        fields[name] = createField({ name, schema: propertySchema, isRequired, registry, options });
    }

    return fields;
};
```

Create `packages/app-admin/src/features/formModel/jsonSchema/isPlainObject.ts` (shared by the two value converters):

```ts
export type PlainObject = Record<string, unknown>;

export const isPlainObject = (value: unknown): value is PlainObject => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};
```

Create `packages/app-admin/src/features/formModel/jsonSchema/jsonSchemaValueToFormData.ts`:

```ts
import type { JsonSchema } from "./JsonSchema.js";
import { getJsonSchemaKind } from "./getJsonSchemaKind.js";
import { normalizeJsonSchema } from "./normalizeJsonSchema.js";
import { isPlainObject } from "./isPlainObject.js";
import type { PlainObject } from "./isPlainObject.js";

const toFormValue = (schema: JsonSchema, value: unknown): unknown => {
    const kind = getJsonSchemaKind(schema);
    const input = value === undefined ? schema.default : value;

    if (kind === "object") {
        return jsonSchemaValueToFormData(schema, input);
    }
    if (kind === "objectList") {
        const items = Array.isArray(input) ? input : [];
        const itemSchema = normalizeJsonSchema(schema.items);
        return items.map(item => jsonSchemaValueToFormData(itemSchema, item));
    }
    if (kind === "stringList") {
        return Array.isArray(input) ? input : [];
    }
    if (kind === "json") {
        return input === undefined ? null : JSON.stringify(input, null, 2);
    }
    return input === undefined ? null : input;
};

/*
 * Converts a stored value into form data for the fields `buildFieldsFromJsonSchema` builds
 * (R271): every property is present (its default, else `null`, `[]` for a list), a nested object
 * and each list item become form data too, and a JSON text field holds the stringified value.
 */
export const jsonSchemaValueToFormData = (schema: JsonSchema, value: unknown): PlainObject => {
    const data: PlainObject = {};
    if (getJsonSchemaKind(schema) !== "object") {
        return data;
    }

    const source: PlainObject = isPlainObject(value) ? value : {};
    const properties = schema.properties ?? {};

    for (const [name, property] of Object.entries(properties)) {
        const propertySchema = normalizeJsonSchema(property);
        data[name] = toFormValue(propertySchema, source[name]);
    }

    return data;
};
```

Create `packages/app-admin/src/features/formModel/jsonSchema/formDataToJsonSchemaValue.ts`:

```ts
import type { JsonSchema } from "./JsonSchema.js";
import { getJsonSchemaKind } from "./getJsonSchemaKind.js";
import { normalizeJsonSchema } from "./normalizeJsonSchema.js";
import { isPlainObject } from "./isPlainObject.js";
import type { PlainObject } from "./isPlainObject.js";

const parseJsonText = (text: string): unknown => {
    try {
        return JSON.parse(text);
    } catch {
        // The text stays as typed; the field's own check reports it before a save.
        return text;
    }
};

const isEmptyScalar = (value: unknown): boolean => {
    return value === null || value === undefined || value === "";
};

/*
 * The value of one property, or `undefined` to leave the key out. An empty scalar is left out; an
 * empty list or object is left out too unless the property is required.
 */
const toSchemaValue = (schema: JsonSchema, data: unknown, isRequired: boolean): unknown => {
    const kind = getJsonSchemaKind(schema);

    if (kind === "object") {
        const nested = formDataToJsonSchemaValue(schema, data);
        return Object.keys(nested).length > 0 || isRequired ? nested : undefined;
    }
    if (kind === "objectList") {
        const items = Array.isArray(data) ? data : [];
        const itemSchema = normalizeJsonSchema(schema.items);
        const values = items.map(item => formDataToJsonSchemaValue(itemSchema, item));
        return values.length > 0 || isRequired ? values : undefined;
    }
    if (kind === "stringList") {
        const items = Array.isArray(data) ? data : [];
        return items.length > 0 || isRequired ? items : undefined;
    }
    if (isEmptyScalar(data)) {
        return undefined;
    }
    if (kind === "json") {
        const text = String(data);
        return text.trim() === "" ? undefined : parseJsonText(text);
    }
    return data;
};

/*
 * Converts form data back into the stored value (R271): empty fields are left out, a JSON text
 * field is parsed (text that does not parse is kept as typed), a nested object and each list item
 * convert the same way. The inverse of `jsonSchemaValueToFormData`.
 */
export const formDataToJsonSchemaValue = (schema: JsonSchema, data: unknown): PlainObject => {
    const value: PlainObject = {};
    if (getJsonSchemaKind(schema) !== "object") {
        return value;
    }

    const source: PlainObject = isPlainObject(data) ? data : {};
    const requiredNames = Array.isArray(schema.required) ? schema.required : [];
    const properties = schema.properties ?? {};

    for (const [name, property] of Object.entries(properties)) {
        const isRequired = requiredNames.includes(name);
        const propertySchema = normalizeJsonSchema(property);
        const propertyValue = toSchemaValue(propertySchema, source[name], isRequired);
        if (propertyValue !== undefined) {
            value[name] = propertyValue;
        }
    }

    return value;
};
```

Create `packages/app-admin/src/features/formModel/jsonSchema/createJsonSchemaValidator.ts`:

```ts
import { z } from "zod";
import type { JsonSchema } from "./JsonSchema.js";

export interface JsonSchemaIssue {
    path: string;
    message: string;
}

export interface JsonSchemaValidationResult {
    valid: boolean;
    issues: JsonSchemaIssue[];
}

export interface JsonSchemaValidator {
    validate(value: unknown): JsonSchemaValidationResult;
}

const VALID: JsonSchemaValidationResult = { valid: true, issues: [] };

const buildZodSchema = (schema: JsonSchema): z.ZodType | null => {
    try {
        return z.fromJSONSchema(schema);
    } catch {
        // `z.fromJSONSchema` throws for a schema it cannot build (an unknown type, a missing $ref).
        return null;
    }
};

/*
 * Rebuilds the schema's validator with `z.fromJSONSchema` (R271). It never throws: a schema zod
 * cannot build gives a validator that reports every value as valid. An issue's `path` is the
 * dot-joined zod path (empty for the value itself), like the server's settings issues.
 */
export const createJsonSchemaValidator = (schema: JsonSchema): JsonSchemaValidator => {
    const zodSchema = buildZodSchema(schema);

    return {
        validate(value: unknown): JsonSchemaValidationResult {
            if (!zodSchema) {
                return VALID;
            }
            try {
                const result = zodSchema.safeParse(value);
                if (result.success) {
                    return VALID;
                }
                const issues = result.error.issues.map(issue => {
                    const path = issue.path.map(String).join(".");
                    return { path, message: issue.message };
                });
                return { valid: false, issues };
            } catch {
                return VALID;
            }
        }
    };
};
```

Modify `packages/app-admin/src/index.ts`. In the FormModel section, after the `useLayoutRenderers` export:

Before:

```ts
export { useFieldRenderers } from "./features/formModel/useFieldRenderers.js";
export { useLayoutRenderers } from "./features/formModel/useLayoutRenderers.js";

// Import all field renderers to ensure their module augmentations are applied.
```

After:

```ts
export { useFieldRenderers } from "./features/formModel/useFieldRenderers.js";
export { useLayoutRenderers } from "./features/formModel/useLayoutRenderers.js";

export { buildFieldsFromJsonSchema } from "./features/formModel/jsonSchema/buildFieldsFromJsonSchema.js";
export { jsonSchemaValueToFormData } from "./features/formModel/jsonSchema/jsonSchemaValueToFormData.js";
export { formDataToJsonSchemaValue } from "./features/formModel/jsonSchema/formDataToJsonSchemaValue.js";
export { createJsonSchemaValidator } from "./features/formModel/jsonSchema/createJsonSchemaValidator.js";
export type { JsonSchemaValidator } from "./features/formModel/jsonSchema/createJsonSchemaValidator.js";
export type { JsonSchemaValidationResult } from "./features/formModel/jsonSchema/createJsonSchemaValidator.js";
export type { JsonSchemaIssue } from "./features/formModel/jsonSchema/createJsonSchemaValidator.js";
export type { JsonSchema } from "./features/formModel/jsonSchema/JsonSchema.js";
export type { JsonSchemaFieldOptions } from "./features/formModel/jsonSchema/JsonSchemaFieldOptions.js";

// Import all field renderers to ensure their module augmentations are applied.
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-admin/src/features/formModel/jsonSchema/getJsonSchemaKind.test.ts 2>&1 | tail -30
yarn test packages/app-admin/src/features/formModel/jsonSchema/buildFieldsFromJsonSchema.test.ts 2>&1 | tail -30
yarn test packages/app-admin/src/features/formModel/jsonSchema/jsonSchemaValueToFormData.test.ts 2>&1 | tail -30
yarn test packages/app-admin/src/features/formModel/jsonSchema/formDataToJsonSchemaValue.test.ts 2>&1 | tail -30
yarn test packages/app-admin/src/features/formModel/jsonSchema/createJsonSchemaValidator.test.ts 2>&1 | tail -30
```

Expected: PASS (7 in getJsonSchemaKind.test.ts, 36 in buildFieldsFromJsonSchema.test.ts, 8 in jsonSchemaValueToFormData.test.ts, 10 in formDataToJsonSchemaValue.test.ts, 6 in createJsonSchemaValidator.test.ts). Notes to check on the first run: the number-bound cases call `field.validate({ force: true })` because `validate` memoizes by value; a nested property is addressed by its dotted path (`form.field("auth.user")`). If a `select` case reports `renderer` `textInput`, the `.options()` call did not run (a numeric enum must call `registry.number().options(...)`, a string enum `registry.text().options(...)`).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-admin/src/features/formModel/FormModel.test.ts 2>&1 | tail -20
yarn test packages/app-admin/src/features/formModel/FieldBuilder.test.ts 2>&1 | tail -20
yarn check:test:types -p app-admin --report cli 2>&1 | tail -40
yarn build -p @webiny/app-admin --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors (the build type-checks the co-located tests and proves the new `index.ts` exports; `app-workflows` imports them from `dist` in Tasks 12 and 13, so build `app-admin` before those tasks).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-admin --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-admin): add the JSON-schema to FormModel adapter and validator" -m "buildFieldsFromJsonSchema turns an object schema into FormModel fields (text, textarea, select, number with bounds, switch, nested object, list of strings, list of objects, JSON text fallback), jsonSchemaValueToFormData and formDataToJsonSchemaValue convert between the stored value and the form data, and createJsonSchemaValidator rebuilds the validator with z.fromJSONSchema and never throws." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`JsonSchema.type` is narrowed** to zod's literal union (`"object" | "array" | "string" | "number" | "boolean" | "null" | "integer"`), and `enum` to `string | number | boolean | null`, so a `JsonSchema` is assignable to the argument of `z.fromJSONSchema` without a cast. A schema whose real `type` is a list (`["string", "null"]`) is not representable and is read as no supported shape, so it renders as a JSON text field. Task 12 maps the GraphQL `settingsSchema` (`JSON`) to `JsonSchema` with one annotation or cast of its own.
- **Two extra internal files** (`getJsonSchemaKind.ts`, `normalizeJsonSchema.ts`): the build function and both conversions must agree on how a property is classified, and a property that is not a schema object (`null`, `true`) must not crash any of them. Neither is exported from the package.
- **`uiRenderers` values are typed `FieldRendererName<"text", false>`**: a text renderer that needs no options. The contract says 9a passes `{ team: <the teams picker renderer name> }`. A property with `ui: "team"` holds one team id (a string), while the People step's `teams` field (Task 11) is a list of ids: Tasks 11 and 12 must register a renderer for the single-team case (a `text` field renderer built on `WorkflowPicker`, Task 4) and pass its name, or make the teams renderer accept both. This task only defines the typing; it does not decide it.
- **Copy:** `{Label} is required.` (R276), `Enter a number from {min} to {max}.` (QBZ-40), and the four texts the user accepted in `00-answers.md` Q45 (`Enter a number of at least {min}.`, `Enter a number of at most {max}.`, `Enter a whole number.`, `Enter valid JSON.`). Exclusive bounds (`exclusiveMinimum`/`exclusiveMaximum`) have no accepted text and keep zod's message (`Too small: expected number to be >5`); no 9a definition uses them. The same texts show as `Saved settings no longer validate: {error}` for `createJsonSchemaValidator` issues only where zod produced them (the validator keeps zod's messages, QBZ-13).
- **`required` skips `boolean` and `object`**: R271 says the object's `required` list marks the property required unless it has a `default`; a required switch would only add an asterisk to a control that always has a value, and a nested object holds its own required properties.
- **A boolean with no `default` and no stored value is saved as `false`**: the `boolean` field turns `null` into `false` and `formDataToJsonSchemaValue` keeps `false`, so an automation's stored settings gain `enabled: false` keys the admin never touched (the server schema accepts them; pinned by a test).
- **List items never take a `ui` hint** (`z.array(z.string().meta({ ui: "team" }))` renders as tags); no 9a definition needs it.
- **`JsonSchemaType` and `JsonSchemaEnumValue`** are not exported from the package index (reachable through `JsonSchema`, enough for Task 12).
- **Object defaults** are applied by `jsonSchemaValueToFormData`, not by the builder (`ObjectFieldBuilder` has no per-object default). Task 12 loads every settings form through that function, so a new automation step starts with the defaults.
- **Empty rules of `formDataToJsonSchemaValue`** (not in R271): an empty scalar and an optional empty list or object are left out so the stored settings stay minimal and a required one is reported by the validator; `0` and `false` are kept.
- **Path format** of `JsonSchemaIssue.path` is the dot-joined zod path (`headers.0.name`), the same as the server's `AutomationSettingsIssue.path` (`parseAutomationSettings`, `packages/api-workflows/src/domain/automation/parseAutomationSettings.ts`), so Task 12 can map either to a form field by `config.settings.<path>`; list items use the numeric index, and `FormModel.field("settings.headers.0.name")` addresses a list item child by that numeric segment (checked against `FormModel.field`: a list object field takes the index, then the child), so Task 14 passes the path as it is and wraps the call in a try/catch for a path no form field has.
- **Verified by running** (a throwaway checkout, not committed): `z.fromJSONSchema` throws `Reference not found` for an unresolved `$ref`, `Unsupported type: weird` for an unknown type and a `TypeError` for `null` or a string; `z.toJSONSchema(..., { io: "input" })` writes `.meta({ ui })` as a sibling `ui` keyword and leaves a field with a `.default()` out of `required`.
- Size: medium (eight small source files, five test files, one index hunk).
