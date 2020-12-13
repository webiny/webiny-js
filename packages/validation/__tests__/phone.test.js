import { validation, ValidationError } from "../src";

describe("phone test", () => {
    it("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate(null, "phone")).resolves.toBe(true);
    });

    it("should fail - value contains invalid characters", async () => {
        await expect(validation.validate('"""£@!DAs12312', "phone")).rejects.toThrow(
            ValidationError
        );
    });

    it("should pass - only numbers", async () => {
        await expect(validation.validate("0911231232", "phone")).resolves.toBe(true);
    });

    it("should pass with slashes and hyphens", async () => {
        await expect(validation.validate("091/123-1232", "phone")).resolves.toBe(true);
    });

    it("should pass with plus sign as a prefix and round brackets", async () => {
        await expect(validation.validate("+(091)/4123-3212", "phone")).resolves.toBe(true);
    });
});
