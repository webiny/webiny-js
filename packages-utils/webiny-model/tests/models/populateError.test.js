import { assert } from "chai";
import { ModelError, Model } from "../..";

describe("populate error test", async function() {
    it("should throw error - populate can only receive objects", async () => {
        const user = new Model();

        let error = null;
        try {
            user.populate(123);
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.type, ModelError.POPULATE_FAILED_NOT_OBJECT);

        error = null;
        try {
            user.populateFromStorage(123);
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.type, ModelError.POPULATE_FAILED_NOT_OBJECT);
    });
});
