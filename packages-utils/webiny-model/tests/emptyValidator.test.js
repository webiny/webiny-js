import { assert } from "chai";
import Model from "./../src/model";

describe("empty validator test", function() {
    it("should validate correctly - no error should be thrown", async () => {
        const user = new Model(function() {
            this.attr("yearOfBirth").integer();
        });

        user.yearOfBirth = 105;
        await user.validate();
    });
});
