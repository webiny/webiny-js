import { validation, ValidationError } from "../src";

describe("multiple validators test", () => {
    it("should fail -  e-mail set but not valid", () => {
        expect(validation.validate("email@webiny", "required,email")).rejects.toThrow(
            ValidationError
        );
    });

    it("should pass - valid e-mail set", () => {
        expect(validation.validate("email@webiny.com", "required,email")).resolves.toBe(true);
    });

    it("should fail - number set but not greater than 100", () => {
        expect(validation.validate(15.5, "required,gt:100")).rejects.toThrow(ValidationError);
    });

    it("should pass - number greater than 100 set", () => {
        expect(validation.validate(250, "required,gt:100")).resolves.toBe(true);
    });

    it("should fail - number set, greater than 100 but not lower than 200", () => {
        expect(validation.validate(250, "required,gt:100,lt:200")).rejects.toThrow(ValidationError);
    });

    it("should pass - number greater than 100 and lower than 200", () => {
        expect(validation.validate(150, "required,gt:100,lt:200")).resolves.toBe(true);
    });

    it("should fail - number set, greater than 100, lower than 200, but not integer", () => {
        expect(validation.validate("150.1", "required,gt:100,lt:200,integer")).rejects.toThrow(
            ValidationError
        );
    });

    it("should pass - integer number set, greater than 100, lower than 200", () => {
        expect(validation.validate(150, "required,gt:100,lt:200,integer")).resolves.toBe(true);
    });
});
