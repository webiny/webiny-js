import { validation, ValidationError } from "./../src";

describe("disabling error throwing test", () => {
    it("by default it must throw errors on invalid data", async () => {
        let error = null;
        try {
            await validation.validate("1234567890", "required,email,minLength:5");
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ValidationError);

        expect(error.message).toBeString();
        expect(error.validator).toBe("email");
        expect(error.value).toBe("1234567890");

        error.message = "123";
        error.validator = "xyz";
        error.value = "abc";

        expect(error.message).toBe("123");
        expect(error.validator).toBe("xyz");
        expect(error.value).toBe("abc");
    });

    it("should not throw errors when options' throw flag is set to false", async () => {
        // Sync
        let results = validation.validateSync("", "required", { throw: false });
        expect(results).toBeInstanceOf(ValidationError);

        expect(results.message).toEqual("Value is required.");
        expect(results.validator).toEqual("required");
        expect(results.value).toEqual("");

        // Async
        results = await validation.validate("", "required", { throw: false });
        expect(results).toBeInstanceOf(ValidationError);

        expect(results.message).toEqual("Value is required.");
        expect(results.validator).toEqual("required");
        expect(results.value).toEqual("");
    });
});
