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
