import ModelError from "webiny-model/modelError";
import { Model } from "webiny-model";

describe("attribute models test", () => {
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

    test("should not accept inline functions, must always receive a Model class", async () => {
        class ModelsAttributeWithoutModelsClassModel extends Model {
            constructor() {
                super();
                this.attr("modelsAttribute1").models(() => {});
            }
        }

        try {
            new ModelsAttributeWithoutModelsClassModel();
        } catch (e) {
            expect(e.message).toEqual(
                `"models" attribute "modelsAttribute1" received an invalid class (subclass of Model is required).`
            );
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    test("should fail - attributes should accept array of models", async () => {
        model.attribute1 = new Model1();
        expect(model.attribute1).toBeInstanceOf(Model1);

        model.attribute2 = new Model1();
        expect(model.attribute2).toBeInstanceOf(Model1);

        try {
            await model.validate();
        } catch (e) {
            expect(e.data.invalidAttributes.attribute1.code).toEqual(ModelError.INVALID_ATTRIBUTE);
            expect(e.data.invalidAttributes.attribute2.code).toEqual(ModelError.INVALID_ATTRIBUTE);
            return;
        }

        throw Error("Error should've been thrown.");
    });

    test("should pass - empty arrays set", async () => {
        model.attribute1 = [];
        model.attribute2 = [];
        await model.validate();
    });

    test("should fail - arrays with empty plain objects set - nested validation must be triggered", async () => {
        model.attribute1 = [{}, {}];
        model.attribute2 = [{}, {}, {}];
        try {
            await model.validate();
        } catch (e) {
            const attr1 = e.data.invalidAttributes.attribute1;
            expect(attr1.data.length).toBe(2);
            expect(attr1.data[0].data.index).toEqual(0);
            expect(attr1.data[0].data.invalidAttributes.name.code).toEqual(
                ModelError.INVALID_ATTRIBUTE
            );
            expect(attr1.data[0].data.invalidAttributes.name.data.validator).toEqual("required");
            expect(attr1.data[0].data.invalidAttributes.type).toBeUndefined();

            const attr2 = e.data.invalidAttributes.attribute2;
            expect(attr2.data.length).toBe(3);
            expect(attr2.data[0].data.index).toEqual(0);
            expect(attr2.data[1].data.index).toEqual(1);
            expect(attr2.data[2].data.index).toEqual(2);

            expect(attr2.data[0].data.invalidAttributes.firstName.code).toEqual(
                ModelError.INVALID_ATTRIBUTE
            );
            expect(attr2.data[0].data.invalidAttributes.lastName.code).toEqual(
                ModelError.INVALID_ATTRIBUTE
            );
            expect(attr2.data[0].data.invalidAttributes.enabled).toBeUndefined();

            return;
        }
        throw Error("Error should've been thrown.");
    });

    test("should pass - valid data sent", async () => {
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

    test("should fail - all good except last item of attribute1", async () => {
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
            expect(attr1.data.length).toBe(1);
            expect(attr1.data[0].data.index).toEqual(2);
            expect(attr1.data[0].data.invalidAttributes.type.code).toEqual(
                ModelError.INVALID_ATTRIBUTE
            );
            expect(attr1.data[0].data.invalidAttributes.type.data.validator).toEqual("in");
        }
    });

    test("should fail on validation since an item is not an object of any type", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [{ name: "Enlai", type: "dog" }, { name: "Rocky", type: "dog" }, 123];

        try {
            await newModel.validate();
        } catch (e) {
            expect(e.code).toEqual("INVALID_ATTRIBUTES");
            expect(e.data).toEqual({
                invalidAttributes: {
                    attribute1: {
                        code: "INVALID_ATTRIBUTE",
                        data: [
                            {
                                code: "INVALID_ATTRIBUTE",
                                data: {
                                    index: 2
                                },
                                message:
                                    "Validation failed, item at index 2 not an instance of Model class."
                            }
                        ],
                        message: "Validation failed."
                    }
                }
            });
            return;
        }

        throw Error("Error should've been thrown.");
    });

    test("validation must be executed on both attribute and model level", async () => {
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

        expect(error).toBeInstanceOf(ModelError);
        expect(error.data).toEqual({
            invalidAttributes: {
                attribute1: {
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
            newModel.attribute1 = [{ name: "Enlai", type: "dog" }];
            await newModel.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
        expect(error.data.invalidAttributes.attribute1.code).toEqual("INVALID_ATTRIBUTE");
        expect(error.data.invalidAttributes.attribute1.data.validator).toEqual("minLength");
        expect(error.data.invalidAttributes.attribute1.data.value.length).toBe(1);
        expect(error.data.invalidAttributes.attribute1.data.value[0]).toBeInstanceOf(Model);

        newModel.attribute1 = [{ name: "Enlai", type: "dog" }, { name: "Enlai", type: "dog" }];
        await newModel.validate();
    });

    test("should not set value if setOnce is enabled", async () => {
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

        expect(await newModel.get("attribute1.0.name")).toEqual("Enlai");
        expect(await newModel.get("attribute1.1.name")).toEqual("Rocky");
        expect(await newModel.get("attribute1.2.name")).toEqual("Lina");
    });

    test("getJSONValue must return an empty array if nothing was set", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        expect(await newModel.getAttribute("attribute1").getJSONValue()).toEqual([]);
    });

    test("getStorageValue method must return empty array if nothing is set", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        expect(await newModel.getAttribute("attribute1").getStorageValue()).toEqual([]);
    });

    test("getStorageValue method must return initially set value if it's not an array", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = null;
        expect(await newModel.getAttribute("attribute1").getStorageValue()).toEqual([]);
    });

    test("getStorageValue must iterate through all models and all of its attributes and return its storage values", async () => {
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

        expect(data).toEqual({
            attribute1: [
                {
                    number: null,
                    name: "Enlai",
                    type: "dog"
                },
                {
                    number: null,
                    name: "Rocky",
                    type: "dog"
                },
                {
                    number: null,
                    name: "Lina",
                    type: "parrot"
                }
            ],
            attribute2: [
                {
                    enabled: null,
                    firstName: "John",
                    lastName: "Doe"
                },
                {
                    enabled: null,
                    firstName: "Jane",
                    lastName: "Doe"
                }
            ]
        });
    });

    test("setStorageValue must omit value if it is not an array", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.getAttribute("attribute1").setStorageValue([{ name: "one" }, { name: "two" }]);
        expect(await newModel.toJSON("attribute1[name]")).toEqual({
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
        expect(await newModel.toJSON("attribute1[name]")).toEqual({
            attribute1: [{ name: "one" }, { name: "two" }]
        });
    });

    test("when toJSON is called, it must return values correctly", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [];
        expect(await newModel.toJSON("attribute1.name")).toEqual({
            attribute1: []
        });

        newModel.getAttribute("attribute1").setStorageValue([{ name: "one" }, { name: "two" }]);
        expect(await newModel.toJSON("attribute1[name]")).toEqual({
            attribute1: [{ name: "one" }, { name: "two" }]
        });

        newModel.attribute1 = null;
        expect(await newModel.toJSON("attribute1.name")).toEqual({
            attribute1: null
        });
    });

    test("getJSONValue must return values correctly", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [];
        expect(await newModel.getAttribute("attribute1").getJSONValue()).toEqual([]);

        newModel.attribute1 = 123;
        expect(await newModel.getAttribute("attribute1").getJSONValue()).toEqual(123);
    });

    test("getJSONValue must return empty objects as items", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").models(Model1);
        });

        newModel.attribute1 = [{ name: 123, age: 123 }, { name: 234, age: 456 }];
        expect(await newModel.getAttribute("attribute1").getJSONValue()).toEqual([{}, {}]);
    });

    test("onSet/onGet must be triggered correctly", async () => {
        const newModel = new Model(function() {
            this.attr("someModels").models(Model1);
        });

        newModel.getAttribute("someModels").onSet(value => {
            const final = [];
            value.forEach((value, index) => {
                final.push({ name: "index-" + index });
            });
            return final;
        });

        newModel.populate({
            someModels: [
                {
                    name: "Webiny LTD",
                    city: "London"
                },
                {
                    name: "Webiny LTD 2",
                    city: "London 2"
                }
            ]
        });

        expect(newModel.someModels[0].name).toEqual("index-0");
        expect(newModel.someModels[1].name).toEqual("index-1");

        newModel.getAttribute("someModels").onGet(() => {
            return "random";
        });

        expect(newModel.someModels).toEqual("random");
    });
});
