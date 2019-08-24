import Model from "@webiny/model/model";
import ModelError from "@webiny/model/modelError";

const model = new Model(function() {
    this.attr("attribute").float();
});

describe("attribute float test", () => {
    test("should accept float values", () => {
        model.attribute = 5.5;
        expect(model.attribute).toEqual(5.5);

        model.attribute = 0;
        expect(model.attribute).toEqual(0);

        model.attribute = null;
        expect(model.attribute).toEqual(null);

        model.attribute = undefined;
        expect(model.attribute).not.toBeDefined();
    });

    ["1", "0", "0.5", {}, [], true, false].forEach(value => {
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

    test("should be able to add numbers and set the total as a new value", () => {
        model.attribute = 5;
        expect(model.attribute).toEqual(5);

        model.attribute = model.attribute + 5;
        expect(model.attribute).toEqual(10);

        model.attribute += 5;
        expect(model.attribute).toEqual(15);
    });

    test("onSet/onGet must be triggered correctly", async () => {
        const someModel = new Model(function() {
            this.attr("someNumber").float();
        });

        someModel.getAttribute("someNumber").onSet(() => {
            return 555;
        });

        someModel.someNumber = 10;
        expect(someModel.someNumber).toEqual(555);

        someModel.getAttribute("someNumber").onGet(() => {
            return "random";
        });

        expect(someModel.someNumber).toEqual("random");
    });
});
