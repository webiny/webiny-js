import { validation } from "@webiny/validation";
import "./chai";

describe("lt test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "lt").should.be.fulfilled;
    });

    it("should fail - numbers are not lower", () => {
        return Promise.all([
            validation.validate(12, "lt:12").should.be.rejected,
            validation.validate(123, "lt:100").should.be.rejected
        ]);
    });

    it("should pass - numbers are lower", () => {
        return Promise.all([
            validation.validate(10, "lt:11").should.become(true),
            validation.validate(11, "lt:11.99").should.become(true)
        ]);
    });
});
