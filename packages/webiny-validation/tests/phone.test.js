import { validation } from "webiny-validation";
import "./chai";

describe("phone test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "phone").should.be.fulfilled;
    });

    it("should fail - value contains invalid characters", () => {
        return validation.validate('"""£@!DAs12312', "phone").should.be.rejected;
    });

    it("should pass - only numbers", () => {
        return validation.validate("0911231232", "phone").should.become(true);
    });

    it("should pass with slashes and hyphens", () => {
        return validation.validate("091/123-1232", "phone").should.become(true);
    });

    it("should pass with plus sign as a prefix and round brackets", () => {
        return validation.validate("+(091)/4123-3212", "phone").should.become(true);
    });
});
