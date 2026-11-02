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

    it("returns a fresh valid result on each call", () => {
        const validator = createJsonSchemaValidator(SCHEMA);

        const first = validator.validate({ url: "https://a.test" });
        const second = validator.validate({ url: "https://a.test" });
        first.issues.push({ path: "url", message: "mutated" });

        expect(first).not.toBe(second);
        expect(second).toEqual({ valid: true, issues: [] });
    });
});
