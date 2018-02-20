import { validation } from "./../src";
import "./chai";

describe("creditCard test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "creditCard").should.be.fulfilled;
    });

    it("should fail - a string was sent", () => {
        return validation.validate("creditCardNumber", "creditCard").should.be.rejected;
    });

    it("should fail - a number was sent", () => {
        return validation.validate(12, "creditCard").should.be.rejected;
    });

    it("should fail - a random long number was sent", () => {
        return validation.validate("12312317238127391", "creditCard").should.be.rejected;
    });

    it("should fail - less than 12 digits sent", () => {
        return validation.validate("42424242424", "creditCard").should.be.rejected;
    });

    it("should pass - a valid credit card number was sent", () => {
        return validation.validate("4242424242424242", "creditCard").should.be.fulfilled;
    });

    it("should pass - a valid credit card with dashes between groups of 4 numbers was sent", () => {
        return validation.validate("4242-4242-4242-4242", "creditCard").should.be.fulfilled;
    });
});
