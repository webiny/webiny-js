import { validation, ValidationError } from "../src";

describe("lt test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "lt")).resolves.toBe(true);
    });

    it("should fail - numbers are not lower", () => {
        expect(validation.validate(12, "lt:12")).rejects.toThrow(ValidationError);
        expect(validation.validate(123, "lt:100")).rejects.toThrow(ValidationError);
    });

    it("should pass - numbers are lower", () => {
        expect(validation.validate(10, "lt:11")).resolves.toBe(true);
        expect(validation.validate(11, "lt:11.99")).resolves.toBe(true);
    });
});
