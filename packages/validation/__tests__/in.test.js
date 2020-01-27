import { validation, ValidationError } from "../src";

describe("in test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "in")).resolves.toBe(true);
    });

    it("should fail - value not in the list", () => {
        expect(validation.validate("ab", "in:abc:123")).rejects.toThrow(ValidationError);
    });

    it("should fail - value not in the list", () => {
        expect(validation.validate(12, "in:abc:123")).rejects.toThrow(ValidationError);
    });

    it("should pass", () => {
        expect(validation.validate("abc", "in:abc:123")).resolves.toBe(true);
        expect(validation.validate("123", "in:abc:123")).resolves.toBe(true);
        expect(validation.validate(123, "in:abc:123")).resolves.toBe(true);
    });
});
