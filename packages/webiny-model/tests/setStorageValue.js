import { assert } from "chai";
import Model from "./../src/model";

describe("setStorageValue test", function() {
    it("should set attribute as set", async () => {
        const user = new Model(function() {
            this.attr("name")
                .char()
                .setStorageValue("Test");
        });

        assert.isTrue(user.getAttribute("name").value.isSet());
    });

    it("must not set attribute as dirty, even if it has a default value set", async () => {
        const user = new Model(function() {
            this.attr("name")
                .char()
                .setValue("SomeDefaultValue");
        });

        assert.isTrue(user.getAttribute("name").value.isDirty());

        user.getAttribute("name").setStorageValue("Test");
        assert.isFalse(user.getAttribute("name").value.isDirty());
    });
});
