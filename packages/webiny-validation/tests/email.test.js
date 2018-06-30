import { validation } from "webiny-validation";
import "./chai";

describe("email test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate(null, "email").should.be.fulfilled;
    });

    it("should fail - a number was sent", () => {
        return validation.validate(12, "email").should.be.rejected;
    });

    it("should fail - TLD missing", () => {
        return validation.validate("asd@google", "email").should.be.rejected;
    });

    it("should fail - contains a space", () => {
        return validation.validate("asd asd@google", "email").should.be.rejected;
    });

    it("should pass", () => {
        return Promise.all([
            validation.validate("webiny@webiny.com", "email").should.be.fulfilled,
            validation.validate("webiny@webiny.io", "email").should.be.fulfilled
        ]);
    });
});
