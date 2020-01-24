import { validation, ValidationError } from "../src";

describe("eq test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "eq")).resolves.toBe(true);
    });

    it("should fail - value not equal", () => {
        expect(validation.validate(12, "eq:123")).rejects.toThrow(ValidationError);
    });

    it("should fail - value not equal", () => {
        expect(validation.validate("test", "eq:123")).rejects.toThrow(ValidationError);
    });

    it("should fail - value not equal", () => {
        expect(validation.validate("text", "eq:105")).rejects.toThrow(ValidationError);
    });

    it("should fail - value not equal", () => {
        expect(validation.validate({}, "eq:105")).rejects.toThrow(ValidationError);
    });

    it("should pass - strings are the same", () => {
        expect(validation.validate("test", "eq:test")).resolves.toBe(true);
        expect(validation.validate("text", "eq:text")).resolves.toBe(true);
    });

    it("should pass - in spite of data types being different", () => {
        expect(validation.validate(11, "eq:11")).resolves.toBe(true);
        expect(validation.validate(11.99, "eq:11.99")).resolves.toBe(true);
    });
});
