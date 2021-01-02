import { validation, ValidationError } from "../src";

describe("in test", () => {
    it("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate(null, "in")).resolves.toBe(true);
    });

    it("should fail - value not in the list", async () => {
        await expect(validation.validate("ab", "in:abc:123")).rejects.toThrow(ValidationError);
    });

    it("should fail - value not in the list: 12", async () => {
        await expect(validation.validate(12, "in:abc:123")).rejects.toThrow(ValidationError);
    });

    it("should pass", async () => {
        await expect(validation.validate("abc", "in:abc:123")).resolves.toBe(true);
        await expect(validation.validate("123", "in:abc:123")).resolves.toBe(true);
        await expect(validation.validate(123, "in:abc:123")).resolves.toBe(true);
    });
});
