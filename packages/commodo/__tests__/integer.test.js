import { validation } from "@webiny/validation";
import "./chai";

describe("integer test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "integer").should.be.fulfilled;
    });

    it("should fail - values are not integers", () => {
        return Promise.all([
            validation.validate(12.2, "integer").should.be.rejected,
            validation.validate("123.32", "integer").should.be.rejected,
            validation.validate("11", "integer").should.be.rejected
        ]);
    });

    it("should pass - valid integers given", () => {
        return validation.validate(11, "integer").should.become(true);
    });
});
