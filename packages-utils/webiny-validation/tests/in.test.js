import { validation } from "./../src";
import "./chai";

describe("in test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "in").should.be.fulfilled;
    });

    it("should fail - value not in the list", () => {
        return validation.validate("ab", "in:abc:123").should.be.rejected;
    });

    it("should fail - value not in the list", () => {
        return validation.validate(12, "in:abc:123").should.be.rejected;
    });

    it("should pass", () => {
        return Promise.all([
            validation.validate("abc", "in:abc:123").should.become(true),
            validation.validate("123", "in:abc:123").should.become(true),
            validation.validate(123, "in:abc:123").should.become(true)
        ]);
    });
});
