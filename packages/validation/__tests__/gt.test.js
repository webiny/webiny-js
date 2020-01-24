import { validation, ValidationError } from "../src";

describe("gt test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "gt")).resolves.toBe(true);
    });

    it("should fail - numbers are not greater", () => {
        expect(validation.validate(12, "gt:12")).rejects.toThrow(ValidationError);
        expect(validation.validate(12, "gt:100")).rejects.toThrow(ValidationError);
    });

    it("should pass - numbers are greater", () => {
        expect(validation.validate(13, "gt:12")).resolves.toBe(true);
        expect(validation.validate(120, "gt:100")).resolves.toBe(true);
    });
});
