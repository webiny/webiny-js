import Model from "webiny-model/model";

describe("setStorageValue test", function() {
    it("should set attribute as set", async () => {
        const user = new Model(function() {
            this.attr("name")
                .char()
                .setStorageValue("Test");
        });

        expect(user.getAttribute("name").value.isSet()).toBeTruthy();
    });

    it("must not set attribute as dirty, even if it has a default value set", async () => {
        const user = new Model(function() {
            this.attr("name")
                .char()
                .setValue("SomeDefaultValue");
        });

        expect(user.getAttribute("name").value.isDirty()).toBeTruthy();

        user.getAttribute("name").setStorageValue("Test");
        expect(user.getAttribute("name").value.isDirty()).toBeFalsy();
    });
});
