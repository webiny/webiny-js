import { expect } from "chai";
import ValidationError from "./../src/validationError";

describe("ValidationError class test", function() {
    it("set / get message must work correctly", () => {
        const error = new ValidationError("Message...", "custom", 123);
        expect(error.message).to.equal("Message...");
        expect(error.validator).to.equal("custom");
        expect(error.value).to.equal(123);
    });

    it("on construct - message, validator and value must be correctly set", () => {
        const error = new ValidationError();
        expect(error.message).to.equal("");
        expect(error.validator).to.equal(null);
        expect(error.value).to.equal(null);
    });
});
