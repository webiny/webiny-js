import { assert } from "chai";
import User from "./entities/user";
import { CharAttribute, BooleanAttribute, IntegerAttribute, DynamicAttribute } from "webiny-model";

describe("getAttributes test", function() {
    it("should return all attributes", async () => {
        const user = new User();

        const allAttributes = user.getAttributes();

        assert.hasAllKeys(allAttributes, [
            "dynamicWithArgs",
            "firstName",
            "lastName",
            "enabled",
            "age",
            "totalSomething",
            "id"
        ]);
        assert.instanceOf(allAttributes["firstName"], CharAttribute);
        assert.instanceOf(allAttributes["lastName"], CharAttribute);
        assert.instanceOf(allAttributes["enabled"], BooleanAttribute);
        assert.instanceOf(allAttributes["age"], IntegerAttribute);
        assert.instanceOf(allAttributes["totalSomething"], DynamicAttribute);
        assert.instanceOf(allAttributes["dynamicWithArgs"], DynamicAttribute);
    });
});
