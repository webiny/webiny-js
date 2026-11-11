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
