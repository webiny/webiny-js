import { validation, ValidationError } from "webiny-validation";

describe("invalid validators test", () => {
    test("must throw error if validators were not passed as a non-empty string", async () => {
        return Promise.all([
            await expect(validation.validate("123", null)).rejects.toThrow(),
            await expect(validation.validate("123", 123)).rejects.toThrow(),
            await expect(validation.validate("123", [])).rejects.toThrow(),
            await expect(validation.validate("123", {}, {})).rejects.toThrow()
        ]);
    });

    test("must throw error on non-existing validator", async () => {
        try {
            await validation.validate("1234567890", "xyz");
        } catch (e) {
            expect(e).toBeInstanceOf(ValidationError);
            expect(e.validator).toBe("xyz");
        }
    });
});
