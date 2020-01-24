import { validation, ValidationError } from "../src";

describe("minLength test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "minLength")).resolves.toBe(true);
    });

    it("should fail - string has less than 5 characters", () => {
        expect(validation.validate("abcd", "minLength:5")).rejects.toThrow(ValidationError);
    });

    it("should pass - string has more than 5 characters", () => {
        expect(validation.validate("abcde", "minLength:5")).resolves.toBe(true);
        expect(validation.validate("abcdefgh", "minLength:5")).resolves.toBe(true);
    });

    it("should fail - array has less than 5 elements", () => {
        expect(validation.validate([1, 2, 3, 4], "minLength:5")).rejects.toThrow(ValidationError);
    });

    it("should pass - array has more than 5 elements", () => {
        expect(validation.validate([1, 2, 3, 4, 5], "minLength:5")).resolves.toBe(true);
        expect(validation.validate([1, 2, 3, 4, 5, 6, 7], "minLength:5")).resolves.toBe(true);
    });

    it("should succeed - object has more than 5 keys", () => {
        expect(
            validation.validate(
                { a: null, b: null, c: null, d: null, e: null, f: null },
                "minLength:5"
            )
        ).resolves.toBe(true);
    });

    it("should fail - object has less than 5 keys", () => {
        expect(validation.validate({ a: null, b: null, c: null }, "minLength:5")).rejects.toThrow(
            ValidationError
        );
    });

    it("should fail - invalid value so no validation is made", () => {
        expect(validation.validate(true, "minLength:5")).resolves.toBe(true);
    });
});
