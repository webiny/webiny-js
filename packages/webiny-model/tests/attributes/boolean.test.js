import { assert } from "chai";
import Model from "./../../src/model";
import ModelError from "./../../src/modelError";

const model = new Model(function() {
    this.attr("attribute").boolean();
});

describe("attribute boolean test", function() {
    it("should accept boolean values", () => {
        model.attribute = false;
        assert.equal(model.attribute, false);

        model.attribute = true;
        assert.equal(model.attribute, true);

        model.attribute = null;
        assert.equal(model.attribute, null);

        model.attribute = undefined;
        assert.isNull(model.attribute);
    });

    [1000, 0, 0.5, {}, [], "some string"].forEach(value => {
        it(`shouldn't accept ${typeof value}`, async () => {
            let error = null;
            try {
                model.attribute = value;
                await model.validate();
            } catch (e) {
                error = e;
            }

            assert.instanceOf(error, ModelError);
            assert.equal(error.code, ModelError.INVALID_ATTRIBUTES);
        });
    });

    it("onSet/onGet must be triggered correctly", async () => {
        const someModel = new Model(function() {
            this.attr("enabled").boolean();
        });

        someModel.getAttribute("enabled").onSet(() => {
            return false;
        });

        someModel.enabled = "test";
        assert.isFalse(someModel.enabled);

        someModel.getAttribute("enabled").onSet(() => {
            return true;
        });

        someModel.enabled = "test222";
        assert.isTrue(someModel.enabled);

        someModel.getAttribute("enabled").onGet(() => {
            return "random";
        });

        assert.equal(someModel.enabled, "random");
    });
});
