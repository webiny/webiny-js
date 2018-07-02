import Model from "webiny-model/model";
import ModelError from "webiny-model/modelError";

const model = new Model(function() {
    this.attr("firstName")
        .char()
        .setValidators("required");
    this.attr("lastName")
        .char()
        .setValidators("required");
    this.attr("age")
        .integer()
        .setValidators("required,gt:30");
});

describe("inline model test", () => {
    test("should return three attributes when getAttributes is called", () => {
        expect(Object.keys(model.getAttributes())).toEqual(["firstName", "lastName", "age"]);
    });

    test("should return attribute when called with getAttribute is called", async () => {
        expect(model.getAttribute("firstName")).toBeDefined();
        expect(model.getAttribute("lastName")).toBeDefined();
        expect(model.getAttribute("age")).toBeDefined();
    });

    test("should successfully validate basic attributes", async () => {
        let error = null;
        try {
            await model.populate({});
            await model.validate();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
        expect(error.code).toEqual(ModelError.INVALID_ATTRIBUTES);

        expect(error.data.invalidAttributes.firstName).toBeDefined();
        expect(error.data.invalidAttributes.lastName).toBeDefined();
        expect(error.data.invalidAttributes.age).toBeDefined();
    });

    test("should successfully populate", async () => {
        let error = null;
        try {
            await model.populate({ firstName: "John", lastName: "Doe", age: 50 });
        } catch (e) {
            error = e;
        }

        expect(error).toBeNull();
    });
});
