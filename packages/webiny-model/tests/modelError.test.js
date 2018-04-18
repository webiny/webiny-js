import { assert } from "chai";
import Model from "./../src/model";
import ModelError from "./../src/modelError";

describe("ModelError class test", function() {
    it("should correctly set / get values", async () => {
        const model = new Model(function() {
            this.attr("number")
                .integer()
                .onSet(value => value + 3);
        });

        model.number = "ASD";

        let error = null;
        try {
            await model.validate();
        } catch (e) {
            error = e;
        }

        assert.equal(error.code, "INVALID_ATTRIBUTES");
        error.code = "changed_type";
        assert.equal(error.code, "changed_type");

        error.message = "changed_message";
        assert.equal(error.message, "changed_message");

        error.data = "changed_data";
        assert.equal(error.data, "changed_data");
    });

    it("should correctly set default on instantiation", async () => {
        const error = new ModelError();
        assert.equal(error.code, "");
        assert.equal(error.message, "");
        assert.deepEqual(error.data, null);
    });
});
