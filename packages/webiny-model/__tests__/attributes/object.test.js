import Model from "webiny-model/model";

describe("attribute models test", () => {
    const model = new Model(function() {
        this.attr("attribute1").object();
        this.attr("attribute2").object();
    });

    test("should fail - attribute should accept object values", async () => {
        model.attribute1 = 123;
        expect(typeof model.attribute1).toBe("number");

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
                        message: "Validation failed, received number, expecting object."
                    },
                    attribute2: {
                        code: "INVALID_ATTRIBUTE",
                        data: null,
                        message: "Validation failed, received object, expecting object."
                    }
                }
            });
            return;
        }

        throw Error("Error should've been thrown.");
    });

    test("should pass - empty objects set", async () => {
        model.attribute1 = {};
        model.attribute2 = {};
        await model.validate();
    });

    test("should pass - valid data sent", async () => {
        model.attribute1 = {a: 1, b: 2};
        model.attribute2 = {c: 123, d: {e: 123, f: null, g: [1, 2, 3, 4, new Date()], h: new Date()}};
        await model.validate();
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


    test("assigning a new object must set attribute as dirty", async () => {
        const someModel = new Model(function() {
            this.attr("company").object();
        });

        someModel.company = {a: 1};
        expect(someModel.getAttribute("company").value.isDirty()).toBe(true);

        someModel.clean();

        someModel.company = {a: 1};
        expect(someModel.getAttribute("company").value.isDirty()).toBe(false);

        someModel.company = {a: 2};
        expect(someModel.getAttribute("company").value.isDirty()).toBe(true);
    });


});
