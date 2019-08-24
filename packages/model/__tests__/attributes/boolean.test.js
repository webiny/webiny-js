import Model from "@webiny/model/model";
import ModelError from "@webiny/model/modelError";

const model = new Model(function() {
    this.attr("attribute").boolean();
});

describe("attribute boolean test", () => {
    test("should accept boolean values", () => {
        model.attribute = false;
        expect(model.attribute).toEqual(false);

        model.attribute = true;
        expect(model.attribute).toEqual(true);

        model.attribute = null;
        expect(model.attribute).toEqual(null);

        model.attribute = undefined;
        expect(model.attribute).not.toBeDefined();
    });

    [1000, 0, 0.5, {}, [], "some string"].forEach(value => {
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

    test("onSet/onGet must be triggered correctly", async () => {
        const someModel = new Model(function() {
            this.attr("enabled").boolean();
        });

        someModel.getAttribute("enabled").onSet(() => {
            return false;
        });

        someModel.enabled = "test";
        expect(someModel.enabled).toBe(false);

        someModel.getAttribute("enabled").onSet(() => {
            return true;
        });

        someModel.enabled = "test222";
        expect(someModel.enabled).toBe(true);

        someModel.getAttribute("enabled").onGet(() => {
            return "random";
        });

        expect(someModel.enabled).toEqual("random");
    });
});
