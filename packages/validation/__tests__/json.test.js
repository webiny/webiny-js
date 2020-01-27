import { validation, ValidationError } from "../src";

describe("JSON test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "json")).resolves.toBe(true);
    });

    it("should fail - invalid json", () => {
        expect(validation.validate("ab", "json")).rejects.toThrow(ValidationError);
    });

    it("should fail - must be string, plain objects cannot be passed", () => {
        expect(validation.validate({ abc: 123 }, "json")).rejects.toThrow(ValidationError);
    });

    it("should pass", () => {
        expect(validation.validate(`{"abc": 123}`, "json")).resolves.toBe(true);
        expect(validation.validate(`{"abc": "123"}`, "json")).resolves.toBe(true);
    });
});
