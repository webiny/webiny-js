import { validation, ValidationError } from "../src";

describe("numeric test", () => {
    it("should not get triggered if an empty value was set", () => {
        expect(validation.validate(null, "numeric")).resolves.toBe(true);
    });

    it("should fail - values are not numerics", () => {
        const values = [NaN, true, [], "asd", "{}", {}, "123._", "11.x", "11.a3211"];

        for (let i = 0; i < values.length; i++) {
            const value = values[i];
            expect(validation.validate(value, "numeric")).rejects.toThrow(ValidationError);
        }
    });

    it("should pass - valid numerics given", () => {
        expect(validation.validate(0, "numeric")).resolves.toBe(true);
        expect(validation.validate(11, "numeric")).resolves.toBe(true);
        expect(validation.validate(11.434242, "numeric")).resolves.toBe(true);
    });
});
