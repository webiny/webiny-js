import ModelError from "@webiny/model/modelError";
import ValidationTestModel from "./models/validationTestModel.js";

describe("validation test", () => {
    test("should throw an error because required fields are missing", async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({});
            await model.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
        expect(error.code).toEqual(ModelError.INVALID_ATTRIBUTES);

        expect(error.data.invalidAttributes.email).toBeDefined();
        expect(error.data.invalidAttributes.required1).toBeDefined();
        expect(error.data.invalidAttributes.required2).toBeDefined();
    });

    test("should throw an error because e-mail is in invalid format", async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({ email: "1234", required1: "something", required2: "something" });
            await model.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
        expect(error.code).toEqual(ModelError.INVALID_ATTRIBUTES);

        expect(error.data.invalidAttributes.email).toBeDefined();
        expect(error.data.invalidAttributes.required1).not.toBeDefined();
        expect(error.data.invalidAttributes.required2).not.toBeDefined();
    });

    test("should't throw errors because all attributes are in order", async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({
                email: "john@gmail.com",
                required1: "something",
                required2: "something"
            });
            await model.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeNull();
    });

    test("should throw error because of 'in' validator", async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({ type: "cat" });
            await model.validate();
        } catch (e) {
            error = e;
        }

        expect(error.data).toEqual({
            invalidAttributes: {
                email: {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        message: "Value is required.",
                        value: null,
                        validator: "required"
                    },
                    message: "Invalid attribute."
                },
                required1: {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        message: "Value is required.",
                        value: null,
                        validator: "required"
                    },
                    message: "Invalid attribute."
                },
                required2: {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        message: "Value is required.",
                        value: null,
                        validator: "required"
                    },
                    message: "Invalid attribute."
                },
                type: {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        message: "Value must be one of the following: bird, dog, parrot.",
                        value: "cat",
                        validator: "in"
                    },
                    message: "Invalid attribute."
                }
            }
        });
    });
});
