import { assert } from "chai";
import Model from "./../../src/model";
import ModelError from "./../../src/modelError";

const model = new Model(function() {
    this.attr("attribute").integer();
});

describe("attribute integer test", function() {
    it("should accept integer values", () => {
        model.attribute = 5;
        assert.equal(model.attribute, 5);

        model.attribute = 0;
        assert.equal(model.attribute, 0);

        model.attribute = null;
        assert.equal(model.attribute, null);

        model.attribute = undefined;
        assert.isUndefined(model.attribute);
    });

    ["1", "0", 0.5, {}, [], true, false].forEach(value => {
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

    it("should be able to add numbers and set the total as a new value", () => {
        model.attribute = 5;
        assert.equal(model.attribute, 5);

        model.attribute = model.attribute + 5;
        assert.equal(model.attribute, 10);

        model.attribute += 5;
        assert.equal(model.attribute, 15);
    });

    it("onSet/onGet must be triggered correctly", async () => {
        const someModel = new Model(function() {
            this.attr("someNumber").integer();
        });

        someModel.getAttribute("someNumber").onSet(() => {
            return 555;
        });

        someModel.someNumber = 10;
        assert.equal(someModel.someNumber, 555);

        someModel.getAttribute("someNumber").onGet(() => {
            return "random";
        });

        assert.equal(someModel.someNumber, "random");
    });
});
