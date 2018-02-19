import { assert } from "chai";
import Model from "./../lib/model";

describe("setDefaultValue test", function() {
    it("should set/get default values", async () => {
        const model = new Model(function() {
            this.attr("email")
                .char()
                .setValidators("required,email")
                .setDefaultValue("test@gmail.com");
            this.attr("something")
                .boolean()
                .setValidators("required")
                .setDefaultValue(false);
            this.attr("something2")
                .integer()
                .setDefaultValue(555);
            this.attr("something3")
                .integer()
                .setDefaultValue(() => 666);
            this.attr("createdOn")
                .date()
                .setValidators()
                .setDefaultValue(new Date());
        });

        await model.populate({});

        assert.equal(model.email, "test@gmail.com");
        assert.equal(model.something, false);
        assert.equal(model.something2, 555);
        assert.equal(model.something3, 666);
        assert.instanceOf(model.createdOn, Date);
    });
});
