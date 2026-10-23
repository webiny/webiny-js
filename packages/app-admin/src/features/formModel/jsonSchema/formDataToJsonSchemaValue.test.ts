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

    it("keeps a cleared string that has a default, so the default does not come back", () => {
        const schema = {
            type: "object",
            properties: {
                greeting: { type: "string", default: "Hello" },
                note: { type: "string" }
            }
        };

        const saved = formDataToJsonSchemaValue(schema, { greeting: "", note: "" });

        expect(saved).toEqual({ greeting: "" });
        expect(jsonSchemaValueToFormData(schema, saved)).toMatchObject({ greeting: "" });
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
