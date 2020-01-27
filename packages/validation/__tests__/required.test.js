import { validation, ValidationError } from "../src";

describe("required test", () => {
    it("should fail - empty string sent", () => {
        expect(validation.validate("", "required")).rejects.toThrow(ValidationError);
    });

    it("should fail - null sent", () => {
        expect(validation.validate(null, "required")).rejects.toThrow(ValidationError);
    });

    it("should pass - non-empty string given", () => {
        expect(validation.validate("0911231232", "required")).resolves.toBe(true);
    });

    it("should pass - number given", () => {
        expect(validation.validate(1, "required")).resolves.toBe(true);
    });

    it('should pass - number "0" given (it is still a valid value)', () => {
        expect(validation.validate(0, "required")).resolves.toBe(true);
    });
});
