import { validation } from "./../src";
import "./chai";

describe("multiple validators test", () => {
    it("should fail -  e-mail set but not valid", () => {
        return validation.validate("email@webiny", "required,email").should.be.rejected;
    });

    it("should pass - valid e-mail set", () => {
        return validation.validate("email@webiny.com", "required,email").should.become(true);
    });

    it("should fail - number set but not greater than 100", () => {
        return validation.validate(15.5, "required,gt:100").should.be.rejected;
    });

    it("should pass - number greater than 100 set", () => {
        return validation.validate(250, "required,gt:100").should.become(true);
    });

    it("should fail - number set, greater than 100 but not lower than 200", () => {
        return validation.validate(250, "required,gt:100,lt:200").should.be.rejected;
    });

    it("should pass - number greater than 100 and lower than 200", () => {
        return validation.validate(150, "required,gt:100,lt:200").should.become(true);
    });

    it("should fail - number set, greater than 100, lower than 200, but not integer", () => {
        return validation.validate("150.1", "required,gt:100,lt:200,integer").should.be.rejected;
    });

    it("should pass - integer number set, greater than 100, lower than 200", () => {
        return validation.validate(150, "required,gt:100,lt:200,integer").should.become(true);
    });
});
