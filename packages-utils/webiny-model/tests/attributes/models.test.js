import { assert } from "chai";
import Model from "./../../src/model";
import ModelError from "./../../src/modelError";
import { User } from "../models/userModels";

describe("attribute models test", function() {
    class Model1 extends Model {
        constructor() {
            super();
            this.attr("name")
                .char()
                .setValidators("required");
            this.attr("number").integer();
            this.attr("type")
                .char()
                .setValidators("in:cat:dog:mouse:parrot");
        }
    }

    class Model2 extends Model {
        constructor() {
            super();
            this.attr("firstName")
                .char()
                .setValidators("required");
            this.attr("lastName")
                .char()
                .setValidators("required");
            this.attr("enabled").boolean();
        }
    }

    const model = new Model(function() {
        this.attr("attribute1").models(Model1);
        this.attr("attribute2").models(Model2);
    });

    it("should fail - attributes should accept array of models", async () => {
        model.attribute1 = new Model1();
        assert.instanceOf(model.attribute1, Model1);

        model.attribute2 = new Model1();
        assert.instanceOf(model.attribute2, Model1);

        try {
            await model.validate();
        } catch (e) {
            assert.equal(e.data.invalidAttributes.attribute1.code, ModelError.INVALID_ATTRIBUTE);
            assert.equal(e.data.invalidAttributes.attribute2.code, ModelError.INVALID_ATTRIBUTE);
            return;
        }

        throw Error("Error should've been thrown.");
    });

    it("should pass - empty arrays set", async () => {
        model.attribute1 = [];
        model.attribute2 = [];
        await model.validate();
    });

    it("should fail - arrays with empty plain objects set - nested validation must be triggered", async () => {
        model.attribute1 = [{}, {}];
        model.attribute2 = [{}, {}, {}];
        try {
            await model.validate();
        } catch (e) {
            const attr1 = e.data.invalidAttributes.attribute1;
            assert.lengthOf(attr1.data.items, 2);
            assert.equal(attr1.data.items[0].data.index, 0);
            assert.equal(
                attr1.data.items[0].data.invalidAttributes.name.code,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.equal(
                attr1.data.items[0].data.invalidAttributes.name.data.validator,
                "required"
            );
            assert.notExists(attr1.data.items[0].data.invalidAttributes.type);

            const attr2 = e.data.invalidAttributes.attribute2;
            assert.lengthOf(attr2.data.items, 3);
            assert.equal(attr2.data.items[0].data.index, 0);
            assert.equal(attr2.data.items[1].data.index, 1);
            assert.equal(attr2.data.items[2].data.index, 2);

            assert.equal(
                attr2.data.items[0].data.invalidAttributes.firstName.code,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.equal(
                attr2.data.items[0].data.invalidAttributes.lastName.code,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.notExists(attr2.data.items[0].data.invalidAttributes.enabled);

            return;
        }
        throw Error("Error should've been thrown.");
    });

    it("should pass - valid data sent", async () => {
        model.attribute1 = [
            { name: "Enlai", type: "dog" },
            { name: "Rocky", type: "dog" },
            { name: "Lina", type: "parrot" }
        ];
        model.attribute2 = [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Jane", lastName: "Doe" }
        ];
        await model.validate();
    });

    it("should fail - all good except last item of attribute1", async () => {
        model.attribute1 = [
            { name: "Enlai", type: "dog" },
            { name: "Rocky", type: "dog" },
            { name: "Lina", type: "bird" }
        ];
        model.attribute2 = [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Jane", lastName: "Doe" }
        ];

        try {
            await model.validate();
        } catch (e) {
            const attr1 = e.data.invalidAttributes.attribute1;
            assert.lengthOf(attr1.data.items, 1);
            assert.equal(attr1.data.items[0].data.index, 2);
            assert.equal(
                attr1.data.items[0].data.invalidAttributes.type.code,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.equal(attr1.data.items[0].data.invalidAttributes.type.data.validator, "in");
        }
    });

    it("should fail on validation since an item is not an object of any type", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [{ name: "Enlai", type: "dog" }, { name: "Rocky", type: "dog" }, 123];

        try {
            await newModel.validate();
        } catch (e) {
            assert.equal(e.code, "INVALID_ATTRIBUTES");
            assert.deepEqual(e.data, {
                invalidAttributes: {
                    attribute1: {
                        code: "INVALID_ATTRIBUTE",
                        data: {
                            items: [
                                {
                                    code: "INVALID_ATTRIBUTE",
                                    data: {
                                        index: 2
                                    },
                                    message:
                                        "Validation failed, item at index 2 not an instance of Model class."
                                }
                            ]
                        },
                        message: "Validation failed."
                    }
                }
            });
            return;
        }

        throw Error("Error should've been thrown.");
    });

    it("validation must be execute on both attribute and model level", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1")
                .models(Model1)
                .setValidators("required,minLength:2");
        });

        let error = null;
        try {
            await newModel.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.deepEqual(error.data, {
            invalidAttributes: {
                attribute1: {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        message: "Value is required.",
                        value: [],
                        validator: "required"
                    },
                    message: "Invalid attribute."
                }
            }
        });

        error = null;
        try {
            newModel.attribute1 = [{ name: "Enlai", type: "dog" }];
            await newModel.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.data.invalidAttributes.attribute1.code, "INVALID_ATTRIBUTE");
        assert.equal(error.data.invalidAttributes.attribute1.data.validator, "minLength");
        assert.lengthOf(error.data.invalidAttributes.attribute1.data.value, 1);
        assert.instanceOf(error.data.invalidAttributes.attribute1.data.value[0], Model);

        newModel.attribute1 = [{ name: "Enlai", type: "dog" }, { name: "Enlai", type: "dog" }];
        await newModel.validate();
    });

    it("should not set value if setOnce is enabled", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [
            { name: "Enlai", type: "dog" },
            { name: "Rocky", type: "dog" },
            { name: "Lina", type: "bird" }
        ];

        newModel.getAttribute("attribute1").setOnce();

        await newModel.set("attribute1", null);

        assert.equal(await newModel.get("attribute1.0.name"), "Enlai");
        assert.equal(await newModel.get("attribute1.1.name"), "Rocky");
        assert.equal(await newModel.get("attribute1.2.name"), "Lina");
    });

    it("getJSONValue must return an empty array if nothing was set", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        assert.deepEqual(await newModel.getAttribute("attribute1").getJSONValue(), []);
    });

    it("getStorageValue method must return empty array if nothing is set", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        assert.deepEqual(await newModel.getAttribute("attribute1").getStorageValue(), []);
    });

    it("getStorageValue method must return initially set value if it's not an array", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = null;
        assert.deepEqual(await newModel.getAttribute("attribute1").getStorageValue(), []);
    });

    it("getStorageValue must iterate through all models and all of its attributes and return its storage values", async () => {
        const storageModel = new Model(function() {
            this.attr("attribute1").models(Model1);
            this.attr("attribute2").models(Model2);
        });
        storageModel.attribute1 = [
            { name: "Enlai", type: "dog" },
            { name: "Rocky", type: "dog" },
            { name: "Lina", type: "parrot" }
        ];
        storageModel.attribute2 = [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Jane", lastName: "Doe" }
        ];

        const data = await storageModel.toStorage();

        assert.deepEqual(data, {
            attribute1: [
                {
                    name: "Enlai",
                    number: null,
                    type: "dog"
                },
                {
                    name: "Rocky",
                    number: null,
                    type: "dog"
                },
                {
                    name: "Lina",
                    number: null,
                    type: "parrot"
                }
            ],
            attribute2: [
                {
                    firstName: "John",
                    lastName: "Doe",
                    enabled: null
                },
                {
                    firstName: "Jane",
                    lastName: "Doe",
                    enabled: null
                }
            ]
        });
    });

    it("setStorageValue must omit value if it is not an array", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.getAttribute("attribute1").setStorageValue([{ name: "one" }, { name: "two" }]);
        assert.deepEqual(await newModel.toJSON("attribute1[name]"), {
            attribute1: [
                {
                    name: "one"
                },
                {
                    name: "two"
                }
            ]
        });

        newModel.getAttribute("attribute1").setStorageValue({});
        newModel.getAttribute("attribute1").setStorageValue(null);
        newModel.getAttribute("attribute1").setStorageValue(123);
        assert.deepEqual(await newModel.toJSON("attribute1[name]"), {
            attribute1: [{ name: "one" }, { name: "two" }]
        });
    });

    it("when toJSON is called, it must return values correctly", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [];
        assert.deepEqual(await newModel.toJSON("attribute1.name"), {
            attribute1: []
        });

        newModel.getAttribute("attribute1").setStorageValue([{ name: "one" }, { name: "two" }]);
        assert.deepEqual(await newModel.toJSON("attribute1[name]"), {
            attribute1: [{ name: "one" }, { name: "two" }]
        });

        newModel.attribute1 = null;
        assert.deepEqual(await newModel.toJSON("attribute1.name"), {
            attribute1: null
        });
    });

    it("getJSONValue must return values correctly", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [];
        assert.deepEqual(await newModel.getAttribute("attribute1").getJSONValue(), []);

        newModel.attribute1 = 123;
        assert.deepEqual(await newModel.getAttribute("attribute1").getJSONValue(), 123);
    });

    it("getJSONValue must return empty objects as items", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [{ name: 123, age: 123 }, { name: 234, age: 456 }];
        assert.deepEqual(await newModel.getAttribute("attribute1").getJSONValue(), [{}, {}]);
    });
});
