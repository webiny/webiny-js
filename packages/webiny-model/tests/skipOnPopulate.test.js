import { assert } from "chai";
import Model from "./../src/model";

describe("skipOnPopulate test", function() {
    it("should set attr1 value, but not attr2 value", async () => {
        const model = new Model(function() {
            this.attr("attr1")
                .char()
                .setSkipOnPopulate();
            this.attr("attr2")
                .char()
                .setValidators("required");
        });

        let error = null;
        try {
            await model.populate({ attr1: "attr1Value", attr2: "attr2Value" });
        } catch (e) {
            error = e;
        }

        assert.isNull(error);
        assert.isNull(model.attr1);
        assert.equal(model.attr2, "attr2Value");
    });
});
