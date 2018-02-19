import { validation } from "./../lib";
import "./chai";

describe("minLength test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "minLength").should.be.fulfilled;
    });

    it("should fail - string has less than 5 characters", () => {
        return validation.validate("abcd", "minLength:5").should.be.rejected;
    });

    it("should pass - string has more than 5 characters", () => {
        return Promise.all([
            validation.validate("abcde", "minLength:5").should.become(true),
            validation.validate("abcdefgh", "minLength:5").should.become(true)
        ]);
    });

    it("should fail - array has less than 5 elements", () => {
        return validation.validate([1, 2, 3, 4], "minLength:5").should.be.rejected;
    });

    it("should pass - array has more than 5 elements", () => {
        return Promise.all([
            validation.validate([1, 2, 3, 4, 5], "minLength:5").should.become(true),
            validation.validate([1, 2, 3, 4, 5, 6, 7], "minLength:5").should.become(true)
        ]);
    });

    it("should succeed - object has more than 5 keys", () => {
        return validation
            .validate({ a: null, b: null, c: null, d: null, e: null, f: null }, "minLength:5")
            .should.become(true);
    });

    it("should fail - object has less than 5 keys", () => {
        return validation.validate({ a: null, b: null, c: null }, "minLength:5").should.be.rejected;
    });

    it("should fail - invalid value so no validation is made", () => {
        return validation.validate(true, "minLength:5").should.be.fulfilled;
    });
});
