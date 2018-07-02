import Model from "webiny-model/model";

describe("setOnce test", () => {
    test("shouldn't allow value change", async () => {
        const model = new Model(function() {
            this.attr("email")
                .char()
                .setValidators("required,email")
                .onGet(() => {
                    return 456;
                })
                .setDynamic(() => {
                    return 123;
                });
            this.attr("something")
                .char()
                .setValidators("required");
        });

        await model.populate({ email: "john@gmail.com", something: "cool" });

        expect(model.something).toEqual("cool");
        expect(model.email).toEqual(123);
    });
});
