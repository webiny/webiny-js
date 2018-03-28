import { assert } from "chai";
import ModelError from "./../src/modelError";
import ValidationTestModel from "./models/validationTestModel.js";

describe("validation test", function() {
    it("should throw an error because required fields are missing", async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({});
            await model.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.code, ModelError.INVALID_ATTRIBUTES);

        assert.isDefined(error.data.invalidAttributes.email);
        assert.isDefined(error.data.invalidAttributes.required1);
        assert.isDefined(error.data.invalidAttributes.required2);
    });

    it("should throw an error because e-mail is in invalid format", async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({ email: "1234", required1: "something", required2: "something" });
            await model.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.code, ModelError.INVALID_ATTRIBUTES);

        assert.isDefined(error.data.invalidAttributes.email);
        assert.isUndefined(error.data.invalidAttributes.required1);
        assert.isUndefined(error.data.invalidAttributes.required2);
    });

    it("should't throw errors because all attributes are in order", async () => {
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

        assert.isNull(error);
    });

    it("should throw error because of 'in' validator", async () => {
        const model = new ValidationTestModel();

        let error = null;
        try {
            await model.populate({ type: "cat" });
            await model.validate();
        } catch (e) {
            error = e;
        }

        assert.deepEqual(error.data, {
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
