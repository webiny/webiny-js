import { expect } from "chai";
import AuthError from "./../src/auth/authError";

describe("AuthError class test", function() {
    it("set / get message must work correctly", () => {
        const error = new AuthError();

        expect(error.message).to.equal("");
        expect(error.data).to.deep.equal({});
        expect(error.type).to.equal("");
    });
});
