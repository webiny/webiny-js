import { validation, ValidationError } from "../src";

describe("email test", () => {
    it("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate(null, "email")).resolves.toBe(true);
    });

    it("should fail - a number was sent", async () => {
        await expect(validation.validate(12, "email")).rejects.toThrow(ValidationError);
    });

    it("should fail - TLD missing", async () => {
        await expect(validation.validate("asd@google", "email")).rejects.toThrow(ValidationError);
    });

    it("should fail - contains a space", async () => {
        await expect(validation.validate("asd asd@google", "email")).rejects.toThrow(
            ValidationError
        );
    });

    it("should pass", async () => {
        await expect(validation.validate("webiny@webiny.com", "email")).resolves.toBe(true);
        await expect(validation.validate("webiny@webiny.io", "email")).resolves.toBe(true);
    });
});
