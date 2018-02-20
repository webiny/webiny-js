import { validation, ValidationError } from "./..//src";
import chai from "./chai";

const { expect } = chai;

validation.setValidator("gender", value => {
    if (!value) return;
    value = value + "";

    if (["male", "female"].includes(value)) {
        return;
    }
    throw new ValidationError('Value needs to be "male" or "female".');
});

describe("gt test", () => {
    it("should not get triggered if an empty value was set", () => {
        return validation.validate("", "gender").should.be.fulfilled;
    });

    it('should return newly registered "gender" validator', () => {
        expect(validation.getValidator("gender")).to.be.a("function");
    });

    it("should fail - invalid gender set", () => {
        return validation.validate("none", "gender").should.be.rejectedWith(ValidationError);
    });

    it("should pass - valid gender set", () => {
        return validation.validate("female", "gender").should.become(true);
    });
});
