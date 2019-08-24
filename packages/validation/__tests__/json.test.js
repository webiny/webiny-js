import { validation } from "@webiny/validation";
import "./chai";

describe("JSON test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "json").should.be.fulfilled;
    });

    it("should fail - invalid json", () => {
        return validation.validate("ab", "json").should.be.rejected;
    });

    it("should fail - must be string, plain objects cannot be passed", () => {
        return validation.validate({ abc: 123 }, "json").should.be.rejected;
    });

    it("should pass", () => {
        return Promise.all([
            validation.validate(`{"abc": 123}`, "json").should.become(true),
            validation.validate(`{"abc": "123"}`, "json").should.become(true)
        ]);
    });
});
