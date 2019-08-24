import { validation, ValidationError } from "@webiny/validation";

describe("async/sync validation test", () => {
    it("must validate asynchronously", async () => {
        await expect(validation.validate("test", "required")).resolves.toBe(true);
        await expect(validation.validate("", "required")).rejects.toThrow(ValidationError);
    });

    it("must validate synchronously", async () => {
        expect(validation.validateSync("test", "required")).toBe(true);
        expect(() => validation.validateSync("", "required")).toThrow(ValidationError);
    });
});
