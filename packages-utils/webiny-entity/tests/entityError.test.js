import { assert } from "chai";
import { EntityError } from "./../src";

describe("entity error test", function() {
    it("should set default entity error values", async () => {
        const e = new EntityError("Test");
        assert.equal(e.message, "Test");
        assert.equal(e.type, null);
        assert.equal(e.data, null);
    });

    it("should set message, type and data", async () => {
        const e = new EntityError("Test", "test", { test: true });
        assert.equal(e.message, "Test");
        assert.equal(e.type, "test");
        assert.equal(e.data.test, true);
    });

    it("should set message, type and data using setter methods", async () => {
        const e = new EntityError("Test", "test", { test: true });
        assert.equal(e.message, "Test");
        assert.equal(e.type, "test");
        assert.equal(e.data.test, true);

        e.message = "Test2";
        e.type = "test2";
        e.data = { test: false };

        assert.equal(e.message, "Test2");
        assert.equal(e.type, "test2");
        assert.equal(e.data.test, false);
    });
});
