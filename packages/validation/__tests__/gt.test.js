import { validation, ValidationError } from "../src";

describe("gt test", () => {
    it("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate(null, "gt")).resolves.toBe(true);
    });

    it("should fail - numbers are not greater", async () => {
        await expect(validation.validate(12, "gt:12")).rejects.toThrow(ValidationError);
        await expect(validation.validate(12, "gt:100")).rejects.toThrow(ValidationError);
    });

    it("should pass - numbers are greater", async () => {
        await expect(validation.validate(13, "gt:12")).resolves.toBe(true);
        await expect(validation.validate(120, "gt:100")).resolves.toBe(true);
    });
});
