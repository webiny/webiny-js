import { validation, ValidationError } from "./../src";
import chai from "./chai";

const { expect } = chai;

describe("invalid validators test", () => {
    it("must throw error if validators were not passed as a non-empty string", () => {
        return Promise.all([
            validation.validate("123", null).should.be.rejected,
            validation.validate("123", 123).should.be.rejected,
            validation.validate("123", []).should.be.rejected,
            validation.validate("123", {}, {}).should.be.rejected
        ]);
    });

    it("must throw error on non-existing validator", () => {
        return validation
            .validate("1234567890", "xyz")
            .should.be.rejectedWith(ValidationError)
            .then(error => {
                expect(error.validator).to.equal("xyz");
            });
    });
});
