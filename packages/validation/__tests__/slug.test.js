import { validation, ValidationError } from "../src";

describe("slug test", () => {
    it("should not get triggered if empty value was set", async () => {
        await expect(validation.validate(null, "slug")).resolves.toBe(true);
    });

    it("should not get triggered if correct value was set", async () => {
        //await expect(validation.validate("test-slug-correct", "slug")).resolves.toBe(true);
        await expect(validation.validate("test-slug", "slug")).resolves.toBe(true);
        await expect(validation.validate("test", "slug")).resolves.toBe(true);
    });

    it("should fail - wrong dash character usage", async () => {
        await expect(validation.validate("test--slug", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("test---slug", "slug")).rejects.toThrow(ValidationError);

        await expect(validation.validate("-test-slug", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("test-slug-", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("--slug--", "slug")).rejects.toThrow(ValidationError);

        await expect(validation.validate("-slug-", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("-slug", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("slug-", "slug")).rejects.toThrow(ValidationError);
    });

    it("should fail - uppercase letters are not allowed", async () => {
        await expect(validation.validate("Test-Slug", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("test-Slug", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("Test-slug", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("tesT-sluG", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("Test", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("tEst", "slug")).rejects.toThrow(ValidationError);
    });

    it("should fail - numbers are not allowed", async () => {
        await expect(validation.validate("test-slug-12345", "slug")).rejects.toThrow(
            ValidationError
        );
        await expect(validation.validate("test-12345-slug", "slug")).rejects.toThrow(
            ValidationError
        );
        await expect(validation.validate("12345-test-slug", "slug")).rejects.toThrow(
            ValidationError
        );
        await expect(validation.validate("test123-slug", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("test-slug123", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("12345-slug", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("slug-12345", "slug")).rejects.toThrow(ValidationError);

        await expect(validation.validate("slug12345", "slug")).rejects.toThrow(ValidationError);
    });

    it("should fail - special chars are not allowed", async () => {
        await expect(validation.validate("test-slug-&%^#", "slug")).rejects.toThrow(
            ValidationError
        );

        await expect(validation.validate("test-&%^#-slug", "slug")).rejects.toThrow(
            ValidationError
        );
        await expect(validation.validate("&%^#-test-slug", "slug")).rejects.toThrow(
            ValidationError
        );

        await expect(validation.validate("&%^#-test", "slug")).rejects.toThrow(ValidationError);
        await expect(validation.validate("test-&%^#", "slug")).rejects.toThrow(ValidationError);

        await expect(validation.validate("test&%^#", "slug")).rejects.toThrow(ValidationError);
    });
});
