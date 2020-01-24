import { validation, ValidationError } from "../src";

describe("email test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "email")).resolves.toBe(true);
    });

    it("should fail - a number was sent", () => {
        expect(validation.validate(12, "email")).rejects.toThrow(ValidationError);
    });

    it("should fail - TLD missing", () => {
        expect(validation.validate("asd@google", "email")).rejects.toThrow(ValidationError);
    });

    it("should fail - contains a space", () => {
        expect(validation.validate("asd asd@google", "email")).rejects.toThrow(ValidationError);
    });

    it("should pass", () => {
        expect(validation.validate("webiny@webiny.com", "email")).resolves.toBe(true);
        expect(validation.validate("webiny@webiny.io", "email")).resolves.toBe(true);
    });
});
