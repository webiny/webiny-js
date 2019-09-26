import { validation } from "@webiny/validation";
import "./chai";

describe("password test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "password").should.be.fulfilled;
    });

    it("should fail - values are too short", () => {
        return Promise.all([
            validation.validate("12312", "password").should.be.rejected,
            validation.validate("123123", "password:10").should.be.rejected
        ]);
    });

    it("should pass - value is long enough", () => {
        return Promise.all([
            validation.validate("123123", "password").should.become(true),
            validation.validate("123", "password:3").should.become(true)
        ]);
    });
});
