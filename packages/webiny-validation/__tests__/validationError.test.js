import { ValidationError } from "webiny-validation";

describe("ValidationError class test", function() {
    it("set / get message must work correctly", () => {
        const error = new ValidationError("Message...", "custom", 123);
        expect(error.message).toEqual("Message...");
        expect(error.validator).toEqual("custom");
        expect(error.value).toEqual(123);
    });

    it("on construct - message, validator and value must be correctly set", () => {
        const error = new ValidationError();
        expect(error.message).toEqual("");
        expect(error.validator).toEqual(null);
        expect(error.value).toEqual(null);
    });
});
