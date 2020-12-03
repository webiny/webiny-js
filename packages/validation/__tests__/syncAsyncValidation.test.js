import { validation, ValidationError } from "../src";

describe("async/sync validation test", () => {
    it("must validate asynchronously", async () => {
        await expect(validation.validate("test", "required")).resolves.toBe(true);
        await expect(validation.validate(null, "required")).rejects.toThrow(ValidationError);
    });

    it("must validate synchronously", async () => {
        expect(validation.validateSync("test", "required")).toBe(true);
        expect(() => validation.validateSync(null, "required")).toThrow(ValidationError);
    });
});
