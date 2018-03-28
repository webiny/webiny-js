import { assert } from "chai";
import User from "./entities/user";

describe("class name test", function() {
    it("should be able to access class name on a class", async () => {
        assert.equal(User.getClassName(), "User");
    });

    it("should be able to access class name on an instance", async () => {
        const user = new User();
        assert.equal(user.getClassName(), "User");
    });
});
