import { validation, ValidationError } from "../src";

describe("password test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "password")).resolves.toBe(true);
    });

    it("should fail - values are too short", () => {
        expect(validation.validate("12312", "password")).rejects.toThrow(ValidationError);
        expect(validation.validate("123123", "password:10")).rejects.toThrow(ValidationError);
    });

    it("should pass - value is long enough", () => {
        expect(validation.validate("123123", "password")).resolves.toBe(true);
        expect(validation.validate("123", "password:3")).resolves.toBe(true);
    });
});
