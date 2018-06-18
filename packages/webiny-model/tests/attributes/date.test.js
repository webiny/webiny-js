import Model from "./../../src/model";
import ModelError from "./../../src/modelError";

const model = new Model(function() {
    this.attr("attribute").date();
});

describe("attribute boolean test", () => {
    test("should accept Date object as value", () => {
        model.attribute = new Date();
        expect(model.attribute).toBeDefined();
        expect(model.attribute).toBeInstanceOf(Date);

        model.attribute = null;
        expect(model.attribute).toEqual(null);

        model.attribute = undefined;
        expect(model.attribute).not.toBeDefined();
    });

    [{}, [], true, false].forEach(value => {
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

    test("should accept Date object and string/number should be converted into Date object", () => {
        model.attribute = 1517520575917;
        expect(model.attribute).toBeInstanceOf(Date);
        expect(+model.attribute).toEqual(1517520575917);

        model.attribute = "2018-02-01T21:29:35.917Z";
        expect(model.attribute).toBeInstanceOf(Date);
        expect(model.attribute.toISOString()).toEqual("2018-02-01T21:29:35.917Z");
    });

    test("onSet/onGet must be triggered correctly", async () => {
        const someModel = new Model(function() {
            this.attr("createdOn").char();
        });

        const april1st2018 = new Date(1522540800 * 1000);
        const april1st2018String = april1st2018.toString();

        someModel.getAttribute("createdOn").onSet(() => {
            return april1st2018;
        });

        someModel.createdOn = new Date();
        expect(String(someModel.createdOn)).toEqual(april1st2018String);

        someModel.getAttribute("createdOn").onGet(() => {
            return "random";
        });

        expect(someModel.createdOn).toEqual("random");
    });
});
