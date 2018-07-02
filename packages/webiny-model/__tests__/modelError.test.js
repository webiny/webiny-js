import Model from "webiny-model/model";
import ModelError from "webiny-model/modelError";

describe("ModelError class test", () => {
    test("should correctly set / get values", async () => {
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

        expect(error.code).toEqual("INVALID_ATTRIBUTES");
        error.code = "changed_type";
        expect(error.code).toEqual("changed_type");

        error.message = "changed_message";
        expect(error.message).toEqual("changed_message");

        error.data = "changed_data";
        expect(error.data).toEqual("changed_data");
    });

    test("should correctly set default on instantiation", async () => {
        const error = new ModelError();
        expect(error.code).toEqual("");
        expect(error.message).toEqual("");
        expect(error.data).toEqual(null);
    });
});
