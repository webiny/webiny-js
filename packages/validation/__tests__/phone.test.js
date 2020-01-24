import { validation, ValidationError } from "../src";

describe("phone test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "phone")).resolves.toBe(true);
    });

    it("should fail - value contains invalid characters", () => {
        expect(validation.validate('"""£@!DAs12312', "phone")).rejects.toThrow(ValidationError);
    });

    it("should pass - only numbers", () => {
        expect(validation.validate("0911231232", "phone")).resolves.toBe(true);
    });

    it("should pass with slashes and hyphens", () => {
        expect(validation.validate("091/123-1232", "phone")).resolves.toBe(true);
    });

    it("should pass with plus sign as a prefix and round brackets", () => {
        expect(validation.validate("+(091)/4123-3212", "phone")).resolves.toBe(true);
    });
});
