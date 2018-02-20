import { validation } from "./../src";
import "./chai";

describe("gte test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "gte").should.be.fulfilled;
    });

    it("should fail - numbers are not greater", () => {
        return Promise.all([
            validation.validate(12, "gte:13").should.be.rejected,
            validation.validate(12, "gte:100").should.be.rejected
        ]);
    });

    it("should pass - numbers are equal", () => {
        return Promise.all([
            validation.validate(12, "gte:12").should.become(true),
            validation.validate(0.54, "gte:0.54").should.become(true)
        ]);
    });

    it("should pass - numbers are greater", () => {
        return Promise.all([
            validation.validate(12, "gte:10").should.become(true),
            validation.validate(0.54, "gte:0").should.become(true)
        ]);
    });
});
