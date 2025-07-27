import { createJsonTransform } from "~/resolver/app/validation/createJsonTransform.js";

describe("validate createJsonTransform", () => {
    it("should parse valid JSON", async () => {
        const validation = createJsonTransform("Test");

        const result = await validation.safeParseAsync(`{"key": "value"}`);

        expect(result.error).toBeUndefined();
        expect(result.success).toBeTrue();
        expect(result.data).toEqual({
            key: "value"
        });
    });

    it("should fail to parse invalid JSON", async () => {
        const validation = createJsonTransform("Test");

        const result = await validation.safeParseAsync(`{"key": "value"`); // Missing closing brace

        expect(result.success).toBeFalse();
        expect(result.error).toBeDefined();
        expect(result.data).toBeUndefined();

        // @ts-expect-error
        expect(result.error.message).toContain(`Test must be a valid JSON string.`);
    });
});
