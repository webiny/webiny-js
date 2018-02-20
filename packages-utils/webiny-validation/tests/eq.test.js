import { validation } from "./../src";
import "./chai";

describe("eq test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "eq").should.be.fulfilled;
    });

    it("should fail - value not equal", () => {
        return validation.validate(12, "eq:123").should.be.rejected;
    });

    it("should fail - value not equal", () => {
        return validation.validate("test", "eq:123").should.be.rejected;
    });

    it("should fail - value not equal", () => {
        return validation.validate("text", "eq:105").should.be.rejected;
    });

    it("should fail - value not equal", () => {
        return validation.validate({}, "eq:105").should.be.rejected;
    });

    it("should pass - strings are the same", () => {
        return Promise.all([
            validation.validate("test", "eq:test").should.be.fulfilled,
            validation.validate("text", "eq:text").should.be.fulfilled
        ]);
    });

    it("should pass - in spite of data types being different", () => {
        return Promise.all([
            validation.validate(11, "eq:11").should.be.fulfilled,
            validation.validate(11.99, "eq:11.99").should.be.fulfilled
        ]);
    });
});
