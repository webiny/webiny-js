import { assert } from "chai";

import SimpleEntity from "./entities/simpleEntity";

describe("driver override test", function() {
    it("should validate given ID correctly (static call)", async () => {
        assert.isFalse(SimpleEntity.isId(123));
        assert.isTrue(SimpleEntity.isId("01234567890123456789adee"));
    });

    it("should validate given ID correctly (instance call)", async () => {
        const user1 = new SimpleEntity();
        assert.isFalse(user1.isId(123));
        assert.isTrue(user1.isId("01234567890123456789adee"));
    });
});
