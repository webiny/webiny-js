import { assert } from "chai";
import Model from "./../src/model";

describe("setOnce test", function() {
    it("shouldn't allow value change", async () => {
        const model = new Model(function() {
            this.attr("email")
                .char()
                .setValidators("required,email")
                .setReadOnly();
            this.attr("something")
                .char()
                .setValidators("required");
        });

        await model.populate({ email: "john@gmail.com", something: "cool" });

        assert.equal(model.something, "cool");
        assert.equal(model.email, null);
    });
});
