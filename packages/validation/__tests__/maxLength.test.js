import { validation, ValidationError } from "../src";

describe("maxLength test", () => {
    it("should not get triggered if an empty value was set", () => {
        return expect(validation.validate(null, "maxLength")).resolves.toBe(true);
    });

    it("should fail - string has more than 5 characters", async () => {
        return expect(validation.validate("abcdef", "maxLength:5")).rejects.toThrow(
            ValidationError
        );
    });

    it("should pass - string has less than 5 characters", () => {
        expect(validation.validate("abc", "maxLength:5")).resolves.toBe(true);
        expect(validation.validate("abcde", "maxLength:5")).resolves.toBe(true);
    });

    it("should pass - string is required and also has to be less than 20 characters long", () => {
        expect(validation.validate("12345678901234567890", "required,maxLength:20")).resolves.toBe(
            true
        ),
            expect(validation.validate("abcde", "required,maxLength:20")).resolves.toBe(true);
    });

    it("should fail - array has more than 5 elements", () => {
        expect(validation.validate([1, 2, 3, 4, 5, 6], "maxLength:5")).rejects.toThrow(
            ValidationError
        );
    });

    it("should pass - array has less than 5 elements", () => {
        expect(validation.validate([1, 2, 3], "maxLength:5")).resolves.toBe(true);
        expect(validation.validate([1, 2, 3, 4, 5], "maxLength:5")).resolves.toBe(true);
    });

    it("should pass - array has less than 5 elements", () => {
        expect(validation.validate([1, 2, 3], "maxLength:5")).resolves.toBe(true);
        expect(validation.validate([1, 2, 3, 4, 5], "maxLength:5")).resolves.toBe(true);
    });

    it("should fail - object has more than 5 keys", () => {
        expect(
            validation.validate(
                { a: null, b: null, c: null, d: null, e: null, f: null },
                "maxLength:5"
            )
        ).rejects.toThrow(ValidationError);
    });

    it("should succeed - object has less than 5 keys", () => {
        expect(validation.validate({ a: null, b: null, c: null }, "maxLength:5")).resolves.toBe(
            true
        );
    });

    it("should fail - invalid value so no validation is made", () => {
        expect(validation.validate(true, "maxLength:5")).resolves.toBe(true);
    });
});
