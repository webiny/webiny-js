import Model from "webiny-model/model";

describe("setOnce test", () => {
    test("shouldn't allow value change", async () => {
        const model = new Model(function() {
            this.attr("email")
                .char()
                .setValidators("required,email")
                .setOnce();
            this.attr("something")
                .char()
                .setValidators("required");
        });

        await model.populate({ email: "john@gmail.com", something: "cool" });

        model.something = "warm";
        model.email = "john2@gmail.com";

        expect(model.something).toEqual("warm");
        expect(model.email).toEqual("john@gmail.com");
    });
});
