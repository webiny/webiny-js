import Model from "webiny-model/model";

describe("empty validator test", () => {
    test("should validate correctly - no error should be thrown", async () => {
        const user = new Model(function() {
            this.attr("yearOfBirth").integer();
        });

        user.yearOfBirth = 105;
        await user.validate();
    });
});
