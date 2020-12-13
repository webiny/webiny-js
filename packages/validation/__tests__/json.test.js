import { validation, ValidationError } from "../src";

describe("JSON test", () => {
    it("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate(null, "json")).resolves.toBe(true);
    });

    it("should fail - invalid json", async () => {
        await expect(validation.validate("ab", "json")).rejects.toThrow(ValidationError);
    });

    it("should fail - must be string, plain objects cannot be passed", async () => {
        await expect(validation.validate({ abc: 123 }, "json")).rejects.toThrow(ValidationError);
    });

    it("should pass", async () => {
        await expect(validation.validate(`{"abc": 123}`, "json")).resolves.toBe(true);
        await expect(validation.validate(`{"abc": "123"}`, "json")).resolves.toBe(true);
    });
});
