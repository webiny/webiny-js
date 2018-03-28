import { assert } from "chai";
import User from "./entities/user";

describe("set test", function() {
    it("should populate values correctly", async () => {
        const user = new User();
        user.populate({ firstName: "John", lastName: "Doe", age: 12, enabled: true });
        assert.equal(user.firstName, "John");
        assert.equal(user.lastName, "Doe");
        assert.equal(user.age, 12);
        assert.equal(user.enabled, true);
    });
});
