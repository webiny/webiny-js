import Model from "./../../src/model";
import ModelError from "./../../src/modelError";
import { User } from "./../models/userModels";

describe("attribute model test", () => {
    test("should not accept inline functions, must always receive a Model class", async () => {
        class ModelAttributeWithoutModelClassModel extends Model {
            constructor() {
                super();
                this.attr("modelAttribute1").model(() => {});
            }
        }

        try {
            new ModelAttributeWithoutModelClassModel();
        } catch (e) {
            expect(e.message).toEqual(
                `"model" attribute "modelAttribute1" received an invalid class (subclass of Model is required).`
            );
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    describe("accepting correct Model classes test", () => {
        class Model1 extends Model {}

        class Model2 extends Model {}

        const model = new Model(function() {
            this.attr("attribute1").model(Model1);
            this.attr("attribute2").model(Model2);
        });

        test("attribute1 should accept Model1", async () => {
            model.attribute1 = new Model1();
            expect(model.attribute1).toBeInstanceOf(Model1);
            try {
                await model.validate();
            } catch (e) {
                throw Error("Error should not have been thrown.");
            }
        });

        test("attribute2 should accept Model2", async () => {
            model.attribute2 = new Model2();
            expect(typeof model.attribute2).toBe("object");
            expect(model.attribute2).toBeInstanceOf(Model2);
            try {
                await model.validate();
            } catch (e) {
                throw Error("Error should not have been thrown.");
            }
        });

        test("attribute1 shouldn't accept Model2 (ModelError must be thrown)", async () => {
            let error = null;
            try {
                model.attribute1 = new Model2();
                await model.validate();
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(ModelError);
            expect(error.code).toEqual(ModelError.INVALID_ATTRIBUTES);
        });

        test("attribute2 shouldn't accept Model1 (ModelError must be thrown", async () => {
            let error = null;
            try {
                model.attribute2 = new Model1();
                await model.validate();
            } catch (e) {
                error = e;
            }

            expect(error).toBeInstanceOf(ModelError);
            expect(error.code).toEqual(ModelError.INVALID_ATTRIBUTES);
        });
    });

    describe("setting nested values to model and all nested models test", () => {
        test("should correctly populate", async () => {
            const user = new User();

            user.populate({
                firstName: "John",
                lastName: "Doe",
                age: 15,
                company: {
                    name: "Webiny LTD",
                    city: "London",
                    image: {
                        file: "webiny.jpg",
                        size: { width: 12.5, height: 44 },
                        visible: false
                    }
                }
            });

            expect(user.firstName).toEqual("John");
            expect(user.lastName).toEqual("Doe");
            expect(user.age).toEqual(15);
            expect(user.company.name).toEqual("Webiny LTD");
            expect(user.company.city).toEqual("London");

            expect(user.company.image.file).toEqual("webiny.jpg");
            expect(user.company.image.visible).toEqual(false);
            expect(user.company.image.size.width).toEqual(12.5);
            expect(user.company.image.size.height).toEqual(44);
        });

        test("should trigger validation error on image size (missing width)", async () => {
            const user = new User();

            let error,
                validator = null;
            try {
                user.populate({
                    firstName: "John",
                    lastName: "Doe",
                    age: 15,
                    company: {
                        name: "Webiny LTD",
                        city: "London",
                        image: {
                            file: "webiny.jpg",
                            size: { width: 12.5 },
                            visible: false
                        }
                    }
                });
                await user.validate();
            } catch (e) {
                error = e;
                validator =
                    e.data.invalidAttributes.company.data.invalidAttributes.image.data
                        .invalidAttributes.size.data.invalidAttributes.height.data.validator;
            }

            expect(error).toBeInstanceOf(ModelError);
            expect(validator).toEqual("required");
        });
    });

    test("validation must be execute on both attribute and model level", async () => {
        const user = new User();

        let error = null;
        try {
            user.populate({
                firstName: "John",
                lastName: "Doe"
            });
            await user.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
        expect(error.data).toEqual({
            invalidAttributes: {
                company: {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        message: "Value is required.",
                        value: null,
                        validator: "required"
                    },
                    message: "Invalid attribute."
                }
            }
        });

        error = null;
        try {
            user.populate({
                firstName: "John",
                lastName: "Doe",
                company: {}
            });
            await user.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
        expect(error.data).toEqual({
            invalidAttributes: {
                company: {
                    code: "INVALID_ATTRIBUTES",
                    data: {
                        invalidAttributes: {
                            name: {
                                code: "INVALID_ATTRIBUTE",
                                data: {
                                    message: "Value is required.",
                                    value: null,
                                    validator: "required"
                                },
                                message: "Invalid attribute."
                            },
                            image: {
                                code: "INVALID_ATTRIBUTE",
                                data: {
                                    message: "Value is required.",
                                    value: null,
                                    validator: "required"
                                },
                                message: "Invalid attribute."
                            }
                        }
                    },
                    message: "Validation failed."
                }
            }
        });
    });

    test("getting values out of model test", async () => {
        const user = new User();
        user.populate({
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    file: "webiny.jpg",
                    size: { width: 12.5, height: 44 },
                    visible: false
                }
            }
        });

        // when accessed directly, it should return a plain object with data
        await expect(typeof user.company).toBe("object");
        await expect(typeof user.company.image).toBe("object");
        await expect(typeof user.company.image.size).toBe("object");

        // when accessing nested key directly, it should return its value
        await expect(user.company.name).toEqual("Webiny LTD");
        await expect(user.company.image.file).toEqual("webiny.jpg");
        await expect(user.company.image.size.width).toEqual(12.5);
    });

    test("should not set value if setOnce is enabled", async () => {
        const user = new User();
        user.populate({
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    file: "webiny.jpg",
                    size: { width: 12.5, height: 44 },
                    visible: false
                }
            }
        });

        user.getAttribute("company").setOnce();

        await user.set("company", null);

        expect(await user.get("company.image.size.width")).toEqual(12.5);
    });

    test("should return empty JSON when getJSONValue is called", async () => {
        const user = new User();
        user.populate({
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    file: "webiny.jpg",
                    size: { width: 12.5, height: 44 },
                    visible: false
                }
            }
        });

        expect(await user.getAttribute("company").getJSONValue()).toEqual({});
    });

    test("toStorage / toJSON should just return current value if not an instance of Model", async () => {
        const user = new User();
        user.populate({ company: 123 });

        expect(await user.getAttribute("company").getJSONValue()).toEqual(123);
        expect(await user.getAttribute("company").getStorageValue()).toEqual(123);
    });

    test("getJSONValue method must return value - we don't do any processing toJSON on it", async () => {
        const user = new User();
        user.company = null;
        expect(await user.getAttribute("company").getJSONValue()).toBeNull();
    });

    test("getStorageValue method must return null", async () => {
        const user = new User();
        expect(await user.getAttribute("company").getStorageValue()).toEqual(null);

        user.company = null;
        expect(await user.getAttribute("company").getStorageValue()).toEqual(null);
    });

    test("getStorageValue must iterate through all attributes and return its storage values", async () => {
        const user = new User();

        user.populate({
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    file: "webiny.jpg",
                    size: { width: 12.5 }
                }
            }
        });

        const data = await user.toStorage();

        expect(data).toEqual({
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    visible: false,
                    file: "webiny.jpg",
                    size: {
                        height: null,
                        width: 12.5
                    }
                }
            }
        });
    });

    test("onSet/onGet must be triggered correctly", async () => {
        const user = new User();
        user.getAttribute("company").onSet(() => {
            return { name: "onSet Name Value", city: "onSet City Value" };
        });

        user.populate({
            company: {
                name: "Webiny LTD",
                city: "London"
            }
        });

        expect(user.company.name).toEqual("onSet Name Value");
        expect(user.company.city).toEqual("onSet City Value");

        user.getAttribute("company").onGet(() => {
            return { random: "Something overridden randomly." };
        });

        expect(await user.toJSON("company")).toEqual({
            company: {
                random: "Something overridden randomly."
            }
        });
    });
});
