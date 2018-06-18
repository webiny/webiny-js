import Model from "./../../src/model";

describe("attribute models test", () => {
    const model = new Model(function() {
        this.attr("attribute1").array();
        this.attr("attribute2").array();
    });

    test("should fail - attributes should accept primitive values", async () => {
        model.attribute1 = {};
        const a = model.attribute1;
        expect(typeof model.attribute1).toBe("object");

        model.attribute2 = new Date();
        expect(model.attribute2).toBeInstanceOf(Date);

        try {
            await model.validate();
        } catch (e) {
            expect(e.data).toEqual({
                invalidAttributes: {
                    attribute1: {
                        code: "INVALID_ATTRIBUTE",
                        data: null,
                        message: "Validation failed, received object, expecting array."
                    },
                    attribute2: {
                        code: "INVALID_ATTRIBUTE",
                        data: null,
                        message: "Validation failed, received object, expecting array."
                    }
                }
            });
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
        model.attribute1 = [123, 234, "asd"];
        model.attribute2 = [123, {}, 234, "asd"];

        try {
            await model.validate();
        } catch (e) {
            expect(e.data).toEqual({
                invalidAttributes: {
                    attribute2: {
                        code: "INVALID_ATTRIBUTE",
                        data: [
                            {
                                code: "INVALID_ATTRIBUTE",
                                data: {
                                    index: 1
                                },
                                message: "Validation failed, item at index 1 not a primitive value."
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

    test("should pass - valid data sent", async () => {
        model.attribute1 = [123, "asd"];
        model.attribute2 = [null, true, false, 123, "asd"];
        await model.validate();
    });

    test("should fail - all good except last item of attribute1", async () => {
        model.attribute1 = ["123", true, []];
        model.attribute2 = ["qwe", true, false];

        try {
            await model.validate();
        } catch (e) {
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
                                message: "Validation failed, item at index 2 not a primitive value."
                            }
                        ],
                        message: "Validation failed."
                    }
                }
            });
        }
    });

    test("should not set value if setOnce is enabled", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1")
                .array()
                .setOnce();
        });

        newModel.attribute1 = [1, 2, 3];

        await newModel.set("attribute1", null);
        expect(newModel.attribute1).toEqual([1, 2, 3]);
    });

    test("should return null as a default JSON value", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").array();
        });

        expect(await newModel.getAttribute("attribute1").getJSONValue()).toBeNull();
    });

    test("should not throw validation error if it is empty", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").array();
        });

        await newModel.validate();
    });

    test("onSet/onGet must be triggered correctly", async () => {
        const someModel = new Model(function() {
            this.attr("company").array();
        });

        someModel.getAttribute("company").onSet(() => {
            return ["one", "two", "three"];
        });

        someModel.populate({
            company: ["x", "y", "z"]
        });

        expect(someModel.company).toEqual(["one", "two", "three"]);

        someModel.getAttribute("company").onGet(() => {
            return ["onGetOverridden"];
        });

        expect(await someModel.toJSON("company")).toEqual({
            company: ["onGetOverridden"]
        });
    });
});
