import { assert } from "chai";
import Model from "./../src/model";

describe("functional validator test", function() {
    it("should validate correctly using function as validator", async () => {
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

        assert.equal(error.data.invalidAttributes.yearOfBirth.data, null);
        assert.equal(error.data.invalidAttributes.yearOfBirth.type, "invalidAttribute");
        assert.equal(error.data.invalidAttributes.yearOfBirth.message, "Invalid year passed.");
    });
});
