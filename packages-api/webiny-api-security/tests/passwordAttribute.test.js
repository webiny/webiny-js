import { assert } from "chai";

import User from "./entities/myUser";
import registerAttributes from "./../src/attributes/registerAttributes";

describe("Password attribute test", () => {
    before(() => {
        registerAttributes();
    });

    it("should encrypt new password", function() {
        const user = new User();
        user.password = "12345";
        assert.notEqual("12345", user.password);
    });

    it("should not encrypt an empty value", function() {
        const user = new User();
        user.password = "12345";
        const encryptedPassword = user.password;
        user.password = null;
        user.password = "";
        user.password = false;
        assert.equal(encryptedPassword, user.password);
    });
});
