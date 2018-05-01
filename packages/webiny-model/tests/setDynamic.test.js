import { assert } from "chai";
import Model from "./../src/model";

describe("setOnce test", function() {
    it("shouldn't allow value change", async () => {
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

        assert.equal(model.something, "cool");
        assert.equal(model.email, 123);
    });
});
