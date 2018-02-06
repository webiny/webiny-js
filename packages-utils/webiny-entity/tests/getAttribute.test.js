import { assert } from "chai";
import User from "./entities/user";
import { CharAttribute, BooleanAttribute, IntegerAttribute } from "webiny-model";

describe("getAttribute test", function() {
    it("should return attribute", async () => {
        const user = new User();
        assert.instanceOf(user.getAttribute("firstName"), CharAttribute);
        assert.instanceOf(user.getAttribute("lastName"), CharAttribute);
        assert.instanceOf(user.getAttribute("enabled"), BooleanAttribute);
        assert.instanceOf(user.getAttribute("age"), IntegerAttribute);
    });

    it("should return undefined because attributes do not exist", async () => {
        const user = new User();
        assert.isUndefined(user.getAttribute("firstName____"), CharAttribute);
        assert.isUndefined(user.getAttribute("lastName____"), CharAttribute);
        assert.isUndefined(user.getAttribute("enabled____"), BooleanAttribute);
        assert.isUndefined(user.getAttribute("age___"), IntegerAttribute);
    });
});
