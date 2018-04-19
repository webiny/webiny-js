import { assert } from "chai";
import Model from "./../../src/model";
import ModelError from "./../../src/modelError";

const model = new Model(function() {
    this.attr("attribute").char();
});

describe("attribute char test", function() {
    it("should accept string values", () => {
        model.attribute = "some string";
        assert.equal(model.attribute, "some string");

        model.attribute = "some string 2";
        assert.equal(model.attribute, "some string 2");

        model.attribute = null;
        assert.equal(model.attribute, null);

        model.attribute = undefined;
        assert.isUndefined(model.attribute);
    });

    [123, 0, 0.5, {}, [], false].forEach(value => {
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

    it("should be able to assign new values by concatenation", () => {
        model.attribute = "this ";
        assert.equal(model.attribute, "this ");

        model.attribute = "this " + "should ";
        assert.equal(model.attribute, "this should ");

        model.attribute += "work";
        assert.equal(model.attribute, "this should work");
    });

    it("onSet/onGet must be triggered correctly", async () => {
        const someModel = new Model(function() {
            this.attr("name").char();
        });

        someModel.getAttribute("name").onSet(() => {
            return "OVERRIDE";
        });

        someModel.name = "test";
        assert.equal(someModel.name, "OVERRIDE");

        someModel.getAttribute("name").onGet(() => {
            return "random";
        });

        assert.equal(someModel.name, "random");
    });
});
