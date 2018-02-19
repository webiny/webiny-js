import { validation } from "./../lib";
import "./chai";

describe("gt test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "gt").should.be.fulfilled;
    });

    it("should fail - numbers are not greater", () => {
        return Promise.all([
            validation.validate(12, "gt:12").should.be.rejected,
            validation.validate(12, "gt:100").should.be.rejected
        ]);
    });

    it("should pass - numbers are greater", () => {
        return Promise.all([
            validation.validate(13, "gt:12").should.become(true),
            validation.validate(120, "gt:100").should.become(true)
        ]);
    });
});
