import Model from "webiny-model/model";

describe("protected test", () => {
    test("should set attr1 value, but not attr2 value", async () => {
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

        expect(error).toBeNull();
        expect(model.attr1).toBeNull();
        expect(model.attr2).toEqual("attr2Value");
    });
});
