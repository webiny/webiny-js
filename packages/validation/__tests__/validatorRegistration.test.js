import { validation, ValidationError } from "@webiny/validation";

validation.setValidator("gender", value => {
    if (!value) return;
    value = value + "";

    if (["male", "female"].includes(value)) {
        return;
    }
    throw new ValidationError('Value needs to be "male" or "female".');
});

describe("gt test", () => {
    test("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate("", "gender")).resolves;
    });

    test('should return newly registered "gender" validator', () => {
        expect(validation.getValidator("gender")).toBeFunction;
    });

    test("should fail - invalid gender set", async () => {
        await expect(validation.validate("none", "gender")).rejects.toThrow(ValidationError);
    });

    test("should pass - valid gender set", async () => {
        await expect(validation.validate("female", "gender")).resolves.toBe(true);
    });
});
