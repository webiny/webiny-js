import { validation, ValidationError } from "../src";

describe("creditCard test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "creditCard")).resolves.toBe(true);
    });

    it("should fail - a string was sent", () => {
        expect(validation.validate("creditCardNumber", "creditCard")).rejects.toThrow(
            ValidationError
        );
    });

    it("should fail - a number was sent", () => {
        expect(validation.validate(12, "creditCard")).rejects.toThrow(ValidationError);
    });

    it("should fail - a random long number was sent", () => {
        expect(validation.validate("12312317238127391", "creditCard")).rejects.toThrow(
            ValidationError
        );
    });

    it("should fail - less than 12 digits sent", () => {
        expect(validation.validate("42424242424", "creditCard")).rejects.toThrow(ValidationError);
    });

    it("should pass - a valid credit card number was sent", () => {
        expect(validation.validate("4242424242424242", "creditCard")).resolves.toBe(true);
    });

    it("should pass - a valid credit card with dashes between groups of 4 numbers was sent", () => {
        expect(validation.validate("4242-4242-4242-4242", "creditCard")).resolves.toBe(true);
    });
});
