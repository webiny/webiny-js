import { validation, ValidationError } from "../src";

describe("gte test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "gte")).resolves.toBe(true);
    });

    it("should fail - numbers are not greater", () => {
        expect(validation.validate(12, "gte:13")).rejects.toThrow(ValidationError);
        expect(validation.validate(12, "gte:100")).rejects.toThrow(ValidationError);
    });

    it("should pass - numbers are equal", () => {
        expect(validation.validate(12, "gte:12")).resolves.toBe(true);
        expect(validation.validate(0.54, "gte:0.54")).resolves.toBe(true);
    });

    it("should pass - numbers are greater", () => {
        expect(validation.validate(12, "gte:10")).resolves.toBe(true);
        expect(validation.validate(0.54, "gte:0")).resolves.toBe(true);
    });
});
