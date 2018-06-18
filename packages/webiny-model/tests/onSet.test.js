import Model from "./../src/model";

describe("onSet test", () => {
    test("should increment the value by 3 on set", async () => {
        const model = new Model(function() {
            this.attr("number")
                .integer()
                .onSet(value => value + 3);
        });

        model.populate({ number: 2 });
        expect(model.getAttribute("number").value.getCurrent()).toEqual(5);
        expect(model.number).toEqual(5);
    });
});
