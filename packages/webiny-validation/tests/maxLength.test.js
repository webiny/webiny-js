import { validation } from "webiny-validation";
import "./chai";

describe("maxLength test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "maxLength").should.be.fulfilled;
    });

    it("should fail - string has more than 5 characters", () => {
        return validation.validate("abcdef", "maxLength:5").should.be.rejected;
    });

    it("should pass - string has less than 5 characters", () => {
        return Promise.all([
            validation.validate("abc", "maxLength:5").should.become(true),
            validation.validate("abcde", "maxLength:5").should.become(true)
        ]);
    });

    it("should pass - string is required and also has to be less than 20 characters long", () => {
        return Promise.all([
            validation
                .validate("12345678901234567890", "required,maxLength:20")
                .should.become(true),
            validation.validate("abcde", "required,maxLength:20").should.become(true)
        ]);
    });

    it("should fail - array has more than 5 elements", () => {
        return validation.validate([1, 2, 3, 4, 5, 6], "maxLength:5").should.be.rejected;
    });

    it("should pass - array has less than 5 elements", () => {
        return Promise.all([
            validation.validate([1, 2, 3], "maxLength:5").should.become(true),
            validation.validate([1, 2, 3, 4, 5], "maxLength:5").should.become(true)
        ]);
    });

    it("should pass - array has less than 5 elements", () => {
        return Promise.all([
            validation.validate([1, 2, 3], "maxLength:5").should.become(true),
            validation.validate([1, 2, 3, 4, 5], "maxLength:5").should.become(true)
        ]);
    });

    it("should fail - object has more than 5 keys", () => {
        return validation.validate(
            { a: null, b: null, c: null, d: null, e: null, f: null },
            "maxLength:5"
        ).should.be.rejected;
    });

    it("should succeed - object has less than 5 keys", () => {
        return validation
            .validate({ a: null, b: null, c: null }, "maxLength:5")
            .should.become(true);
    });

    it("should fail - invalid value so no validation is made", () => {
        return validation.validate(true, "maxLength:5").should.be.fulfilled;
    });
});
