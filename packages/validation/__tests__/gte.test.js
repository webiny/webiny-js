import { validation, ValidationError } from "../src";

describe("gte test", () => {
    it("should not get triggered if an empty value was set", async () => {
        await expect(validation.validate(null, "gte")).resolves.toBe(true);
    });

    it("should fail - numbers are not greater", async () => {
        await expect(validation.validate(12, "gte:13")).rejects.toThrow(ValidationError);
        await expect(validation.validate(12, "gte:100")).rejects.toThrow(ValidationError);
    });

    it("should pass - numbers are equal", async () => {
        await expect(validation.validate(12, "gte:12")).resolves.toBe(true);
        await expect(validation.validate(0.54, "gte:0.54")).resolves.toBe(true);
    });

    it("should pass - numbers are greater", async () => {
        await expect(validation.validate(12, "gte:10")).resolves.toBe(true);
        await expect(validation.validate(0.54, "gte:0")).resolves.toBe(true);
    });
});
