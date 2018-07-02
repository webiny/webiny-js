import { ModelError } from "webiny-model";
import { User, Company } from "./entities/userCompanyImage";

describe("entity nested validation test", () => {
    test("should fail because we have an invalid instance", async () => {
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

        expect(error).toBeInstanceOf(ModelError);
        expect(error.data.invalidAttributes.company.data.invalidAttributes.image.code).toEqual(
            ModelError.INVALID_ATTRIBUTE
        );
    });

    test("should fail because nested data is missing", async () => {
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

        expect(error).toBeInstanceOf(ModelError);
        expect(error.data.invalidAttributes.company.data.invalidAttributes.image.code).toEqual(
            ModelError.INVALID_ATTRIBUTES
        );
        expect(
            error.data.invalidAttributes.company.data.invalidAttributes.image.data.invalidAttributes
                .filename.data.validator
        ).toEqual("required");

        expect(error.data.invalidAttributes.company.data.invalidAttributes.name.code).toEqual(
            ModelError.INVALID_ATTRIBUTE
        );
        expect(
            error.data.invalidAttributes.company.data.invalidAttributes.name.data.validator
        ).toEqual("required");
    });
});
