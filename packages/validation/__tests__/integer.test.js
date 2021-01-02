import { validation, ValidationError } from "../src";

describe("integer test", () => {
    it("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate(null, "integer")).resolves.toBe(true);
    });

    it("should fail - values are not integers", async () => {
        await expect(validation.validate(12.2, "integer")).rejects.toThrow(ValidationError);
        await expect(validation.validate("123.32", "integer")).rejects.toThrow(ValidationError);
        await expect(validation.validate("11", "integer")).rejects.toThrow(ValidationError);
    });

    it("should pass - valid integers given", async () => {
        await expect(validation.validate(11, "integer")).resolves.toBe(true);
    });
});
