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
