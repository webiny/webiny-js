import Model from "@webiny/model/model";

describe("setDefaultValue test", () => {
    test("should set/get default values", async () => {
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
                .setDefaultValue(666);
            this.attr("createdOn")
                .date()
                .setValidators()
                .setDefaultValue(new Date());
        });

        await model.populate({});

        expect(model.email).toEqual("test@gmail.com");
        expect(model.something).toEqual(false);
        expect(model.something2).toEqual(555);
        expect(model.something3).toEqual(666);
        expect(model.createdOn).toBeInstanceOf(Date);
    });

    test("should call setValue for setting default value and mark attribute as dirty", async () => {
        const model = new Model(function() {
            this.attr("email")
                .char()
                .setValidators("required,email")
                .setDefaultValue("test@gmail.com");
        });

        expect(model.email).toEqual("test@gmail.com");
        expect(model.getAttribute("email").value.isDirty()).toBe(true);
    });
});
