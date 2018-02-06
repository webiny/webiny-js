import { assert } from "chai";

import { ModelError } from "webiny-model";
import { User, Company } from "./entities/userCompanyImage";

describe("entity nested validation test", function() {
    it("should fail because we have an invalid instance", async () => {
        const user = new User();

        user.firstName = "John";
        user.lastName = "Doe";
        user.company = {
            name: "Company",
            image: new Company()
        };

        let error = null;
        try {
            await user.save();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(
            error.data.invalidAttributes.company.data.invalidAttributes.image.type,
            ModelError.INVALID_ATTRIBUTE
        );
    });

    it("should fail because nested data is missing", async () => {
        const user = new User();
        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                image: {
                    size: 123.45
                }
            }
        });

        let error = null;
        try {
            await user.save();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(
            error.data.invalidAttributes.company.data.invalidAttributes.image.type,
            ModelError.INVALID_ATTRIBUTES
        );
        assert.equal(
            error.data.invalidAttributes.company.data.invalidAttributes.image.data.invalidAttributes
                .filename.data.validator,
            "required"
        );

        assert.equal(
            error.data.invalidAttributes.company.data.invalidAttributes.name.type,
            ModelError.INVALID_ATTRIBUTE
        );
        assert.equal(
            error.data.invalidAttributes.company.data.invalidAttributes.name.data.validator,
            "required"
        );
    });
});
