import Model from "@webiny/model/model";
import ModelError from "@webiny/model/modelError";

const model = new Model(function() {
    this.attr("attribute").char();
});

describe("attribute char test", () => {
    test("should accept string values", () => {
        model.attribute = "some string";
        expect(model.attribute).toEqual("some string");

        model.attribute = "some string 2";
        expect(model.attribute).toEqual("some string 2");

        model.attribute = null;
        expect(model.attribute).toEqual(null);

        model.attribute = undefined;
        expect(model.attribute).not.toBeDefined();
    });

    [123, 0, 0.5, {}, [], false].forEach(value => {
        test(`shouldn't accept ${typeof value}`, async () => {
            let error = null;
            try {
                model.attribute = value;
                await model.validate();
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(ModelError);
            expect(error.code).toEqual(ModelError.INVALID_ATTRIBUTES);
        });
    });

    test("should be able to assign new values by concatenation", () => {
        model.attribute = "this ";
        expect(model.attribute).toEqual("this ");

        model.attribute = "this " + "should ";
        expect(model.attribute).toEqual("this should ");

        model.attribute += "work";
        expect(model.attribute).toEqual("this should work");
    });

    test("onSet/onGet must be triggered correctly", async () => {
        const someModel = new Model(function() {
            this.attr("name").char();
        });

        someModel.getAttribute("name").onSet(() => {
            return "OVERRIDE";
        });

        someModel.name = "test";
        expect(someModel.name).toEqual("OVERRIDE");

        someModel.getAttribute("name").onGet(() => {
            return "random";
        });

        expect(someModel.name).toEqual("random");
    });
});
