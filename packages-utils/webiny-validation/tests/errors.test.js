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

    it("should not throw errors when options' throw flag is set to false", () => {
        // Sync
        expect(validation.validateSync("", "required", { throw: false })).to.deep.equal({
            message: "Value is required.",
            name: "required",
            value: ""
        });

        // Async
        expect(validation.validate("", "required", { throw: false })).to.become({
            message: "Value is required.",
            name: "required",
            value: ""
        });
    });
});
