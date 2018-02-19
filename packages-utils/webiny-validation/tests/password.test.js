import { validation } from "./../lib";
import "./chai";

describe("password test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "password").should.be.fulfilled;
    });

    it("should fail - values are too short", () => {
        return validation.validate("12312", "password").should.be.rejected;
    });

    it("should pass - value is long enough", () => {
        return validation.validate("123123", "password").should.become(true);
    });
});
