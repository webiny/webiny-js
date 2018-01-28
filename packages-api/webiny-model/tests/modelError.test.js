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

        assert.equal(error.getType(), "invalidAttributes");
        assert.equal(error.setType("changed_type"));
        assert.equal(error.getType(), "changed_type");

        assert.equal(error.setMessage("changed_message"));
        assert.equal(error.getMessage(), "changed_message");

        assert.equal(error.setData("changed_data"));
        assert.equal(error.getData(), "changed_data");
    });

    it("should correctly set default on instantiation", async () => {
        const error = new ModelError();
        assert.equal(error.getType(), "");
        assert.equal(error.getMessage(), "");
        assert.deepEqual(error.getData(), {});
    });
});
