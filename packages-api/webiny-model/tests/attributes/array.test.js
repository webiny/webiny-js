import { assert } from "chai";
import Model from "./../../src/model";
import ModelError from "./../../src/modelError";

describe("attribute models test", function() {
    const model = new Model(function() {
        this.attr("attribute1").array();
        this.attr("attribute2").array();
    });

    it("should fail - attributes should accept primitive values", async () => {
        model.attribute1 = {};
        assert.isObject(model.attribute1);

        model.attribute2 = new Date();
        assert.instanceOf(model.attribute2, Date);

        try {
            await model.validate();
        } catch (e) {
            assert.deepEqual(e.data, {
                invalidAttributes: {
                    attribute1: {
                        type: "invalidAttribute",
                        data: {},
                        message: "Validation failed, received object, expecting array."
                    },
                    attribute2: {
                        type: "invalidAttribute",
                        data: {},
                        message: "Validation failed, received object, expecting array."
                    }
                }
            });
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
        model.attribute1 = [123, 234, "asd"];
        model.attribute2 = [123, {}, 234, "asd"];

        try {
            await model.validate();
        } catch (e) {
            assert.deepEqual(e.data, {
                invalidAttributes: {
                    attribute2: {
                        type: "invalidAttribute",
                        data: {
                            items: [
                                {
                                    type: "invalidAttribute",
                                    data: {
                                        index: 1
                                    },
                                    message:
                                        "Validation failed, item at index 1 not a primitive value."
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

    it("should pass - valid data sent", async () => {
        model.attribute1 = [123, "asd"];
        model.attribute2 = [null, true, false, 123, "asd"];
        await model.validate();
    });

    it("should fail - all good except last item of attribute1", async () => {
        model.attribute1 = ["123", true, []];
        model.attribute2 = ["qwe", true, false];

        try {
            await model.validate();
        } catch (e) {
            assert.deepEqual(e.data, {
                invalidAttributes: {
                    attribute1: {
                        type: "invalidAttribute",
                        data: {
                            items: [
                                {
                                    type: "invalidAttribute",
                                    data: {
                                        index: 2
                                    },
                                    message:
                                        "Validation failed, item at index 2 not a primitive value."
                                }
                            ]
                        },
                        message: "Validation failed."
                    }
                }
            });
        }
    });

    it("should not set value if setOnce is enabled", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1")
                .array()
                .setOnce();
        });

        newModel.attribute1 = [1, 2, 3];

        await newModel.set("attribute1", null);
        assert.deepEqual(newModel.attribute1, [1, 2, 3]);
    });

    it("should return null as a default JSON value", async () => {
        const newModel = new Model(function() {
            this.attr("attribute1").array();
        });

        assert.isNull(await newModel.getAttribute("attribute1").getJSONValue());
    });
});
