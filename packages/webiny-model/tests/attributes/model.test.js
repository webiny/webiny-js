import { assert } from "chai";
import Model from "./../../src/model";
import ModelError from "./../../src/modelError";
import { User } from "./../models/userModels";

describe("attribute model test", function() {
    it("should not accept inline functions, must always receive a Model class", async () => {
        class ModelAttributeWithoutModelClassModel extends Model {
            constructor() {
                super();
                this.attr("modelAttribute1").model(() => {});
            }
        }

        try {
            new ModelAttributeWithoutModelClassModel();
        } catch (e) {
            assert.equal(
                e.message,
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

        it("attribute1 should accept Model1", async () => {
            model.attribute1 = new Model1();
            assert.instanceOf(model.attribute1, Model1);
            try {
                await model.validate();
            } catch (e) {
                throw Error("Error should not have been thrown.");
            }
        });

        it("attribute2 should accept Model2", async () => {
            model.attribute2 = new Model2();
            assert.isObject(model.attribute2);
            assert.instanceOf(model.attribute2, Model2);
            try {
                await model.validate();
            } catch (e) {
                throw Error("Error should not have been thrown.");
            }
        });

        it("attribute1 shouldn't accept Model2 (ModelError must be thrown)", async () => {
            let error = null;
            try {
                model.attribute1 = new Model2();
                await model.validate();
            } catch (e) {
                error = e;
            }

            assert.instanceOf(error, ModelError);
            assert.equal(error.code, ModelError.INVALID_ATTRIBUTES);
        });

        it("attribute2 shouldn't accept Model1 (ModelError must be thrown", async () => {
            let error = null;
            try {
                model.attribute2 = new Model1();
                await model.validate();
            } catch (e) {
                error = e;
            }

            assert.instanceOf(error, ModelError);
            assert.equal(error.code, ModelError.INVALID_ATTRIBUTES);
        });
    });

    describe("setting nested values to model and all nested models test", () => {
        it("should correctly populate", async () => {
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

            assert.equal(user.firstName, "John");
            assert.equal(user.lastName, "Doe");
            assert.equal(user.age, 15);
            assert.equal(user.company.name, "Webiny LTD");
            assert.equal(user.company.city, "London");

            assert.equal(user.company.image.file, "webiny.jpg");
            assert.equal(user.company.image.visible, false);
            assert.equal(user.company.image.size.width, 12.5);
            assert.equal(user.company.image.size.height, 44);
        });

        it("should trigger validation error on image size (missing width)", async () => {
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

            assert.instanceOf(error, ModelError);
            assert.equal(validator, "required");
        });
    });

    it("validation must be execute on both attribute and model level", async () => {
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

        assert.instanceOf(error, ModelError);
        assert.deepEqual(error.data, {
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

        assert.instanceOf(error, ModelError);
        assert.deepEqual(error.data, {
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

    it("getting values out of model test", () => {
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

        it("when accessed directly, it should return a plain object with data", async () => {
            assert.isObject(user.company);
            assert.isObject(user.company.image);
            assert.isObject(user.company.image.size);
        });

        it("when accessing nested key directly, it should return its value", async () => {
            assert.equal(user.company.name, "Webiny LTD");
            assert.equal(user.company.image.file, "webiny.jpg");
            assert.equal(user.company.image.size.width, 12.5);
        });
    });

    it("should not set value if setOnce is enabled", async () => {
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

        assert.equal(await user.get("company.image.size.width"), 12.5);
    });

    it("should return empty JSON when getJSONValue is called", async () => {
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

        assert.deepEqual(await user.getAttribute("company").getJSONValue(), {});
    });

    it("toStorage / toJSON should just return current value if not an instance of Model", async () => {
        const user = new User();
        user.populate({ company: 123 });

        assert.equal(await user.getAttribute("company").getJSONValue(), 123);
        assert.equal(await user.getAttribute("company").getStorageValue(), 123);
    });

    it("getJSONValue method must return value - we don't do any processing toJSON on it", async () => {
        const user = new User();
        user.company = null;
        assert.isNull(await user.getAttribute("company").getJSONValue());
    });

    it("getStorageValue method must return null", async () => {
        const user = new User();
        assert.deepEqual(await user.getAttribute("company").getStorageValue(), null);

        user.company = null;
        assert.deepEqual(await user.getAttribute("company").getStorageValue(), null);
    });

    it("getStorageValue must iterate through all attributes and return its storage values", async () => {
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

        assert.deepEqual(data, {
            firstName: "John",
            lastName: "Doe",
            company: {
                name: "Webiny LTD",
                city: "London",
                image: {
                    file: "webiny.jpg",
                    size: {
                        width: 12.5
                    }
                }
            }
        });
    });

    it("onSet/onGet must be triggered correctly", async () => {
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

        assert.equal(user.company.name, "onSet Name Value");
        assert.equal(user.company.city, "onSet City Value");

        user.getAttribute("company").onGet(() => {
            return { random: "Something overridden randomly." };
        });

        assert.deepEqual(await user.toJSON("company"), {
            company: {
                random: "Something overridden randomly."
            }
        });
    });
});
