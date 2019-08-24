import Model from "@webiny/model/model";

describe("onGet test", () => {
    test("should increment value by 2 on get", async () => {
        const model = new Model(function() {
            this.attr("number")
                .integer()
                .onGet(value => value + 2);
        });

        model.populate({ number: 2 });
        expect(model.getAttribute("number").value.getCurrent()).toEqual(2);
        expect(model.number).toEqual(4);
    });
});
