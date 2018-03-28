import { assert } from "chai";
import User from "./entities/user";

describe("invalid attribute test", function() {
    it("should throw an error - attribute doesn't exist", async () => {
        const user = new User();
        user.something = 123;
        assert.equal(user.something, 123);
    });
});
