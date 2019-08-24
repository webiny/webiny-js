import Model from "@webiny/model/model";

describe("functional validator test", () => {
    test("should validate correctly using function as validator", async () => {
        const user = new Model(function() {
            this.attr("yearOfBirth")
                .integer()
                .setValidators(value => {
                    if (value <= 1950) {
                        throw Error("Invalid year passed.");
                    }
                });
        });

        user.yearOfBirth = 105;

        let error = null;
        try {
            await user.validate();
        } catch (e) {
            error = e;
        }

        expect(error.data.invalidAttributes.yearOfBirth.data).toEqual(null);
        expect(error.data.invalidAttributes.yearOfBirth.code).toEqual("INVALID_ATTRIBUTE");
        expect(error.data.invalidAttributes.yearOfBirth.message).toEqual("Invalid year passed.");
    });
});
