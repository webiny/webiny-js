import { validation, ValidationError } from "./../src";
import chai from "./chai";

const { assert, expect } = chai;

describe("disabling error throwing test", () => {
    it("by default it must throw errors on invalid data", async () => {
        let error = null;
        try {
            await validation.validate("1234567890", "required,email,minLength:5");
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ValidationError);

        assert.isString(error.message);
        assert.equal(error.validator, "email");
        assert.equal(error.value, "1234567890");

        error.message = "123";
        error.validator = "xyz";
        error.value = "abc";

        assert.equal(error.message, "123");
        assert.equal(error.validator, "xyz");
        assert.equal(error.value, "abc");
    });

    it("should not throw errors when options' throw flag is set to false", async () => {
        // Sync
        let results = validation.validateSync("", "required", { throw: false });
        expect(results).to.be.instanceOf(ValidationError);

        expect(results.message).to.equal("Value is required.");
        expect(results.validator).to.equal("required");
        expect(results.value).to.equal("");

        // Async
        results = await validation.validate("", "required", { throw: false });
        expect(results).to.be.instanceOf(ValidationError);

        expect(results.message).to.equal("Value is required.");
        expect(results.validator).to.equal("required");
        expect(results.value).to.equal("");
    });
});
