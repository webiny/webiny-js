import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { toJsonSchema } from "./toJsonSchema.js";

describe("toJsonSchema", () => {
    it("keeps an object schema as it is", () => {
        const schema = { type: "object", properties: { name: { type: "string" } } };

        expect(toJsonSchema(schema)).toBe(schema);
    });

    it("answers null for null and undefined", () => {
        expect(toJsonSchema(null)).toBeNull();
        expect(toJsonSchema(undefined)).toBeNull();
    });

    it("answers null for a value that is not an object schema", () => {
        expect(toJsonSchema("object")).toBeNull();
        expect(toJsonSchema(12)).toBeNull();
        expect(toJsonSchema(true)).toBeNull();
        expect(toJsonSchema([{ type: "object" }])).toBeNull();
    });
});
