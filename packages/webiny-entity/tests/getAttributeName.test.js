import { assert } from "chai";
import User from "./entities/user";

describe("attribute name test", function() {
    it("should return correct attribute name", async () => {
        const user = new User();
        assert.equal(user.getAttribute("firstName").getName(), "firstName");
        assert.equal(user.getAttribute("lastName").getName(), "lastName");
        assert.equal(user.getAttribute("enabled").getName(), "enabled");
        assert.equal(user.getAttribute("age").getName(), "age");
    });
});
