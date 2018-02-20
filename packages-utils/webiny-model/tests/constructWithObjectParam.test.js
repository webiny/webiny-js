import { assert } from "chai";
import Model from "./../src/model";
import ModelError from "./../src/modelError";

const model = new Model({
    definition: function() {
        this.attr("firstName")
            .char()
            .setValidators("required");
        this.attr("lastName")
            .char()
            .setValidators("required");
        this.attr("age")
            .integer()
            .setValidators("required,gt:30");
    }
});

describe("construct with object as first argument", function() {
    it("should just create a new instance, even if empty object was passed", () => {
        const emptyParamsObject = new Model({});
        assert.instanceOf(emptyParamsObject, Model);
    });

    it("invalid param, that is not an object or function, must be ignored", () => {
        const emptyParamsObject = new Model(123);
        assert.instanceOf(emptyParamsObject, Model);
    });

    it("inline definition - should return three attributes when getAttributes is called", () => {
        assert.hasAllKeys(model.getAttributes(), ["firstName", "lastName", "age"]);
    });

    it("inline definition - should return attribute when called with getAttribute is called", async function() {
        assert.isDefined(model.getAttribute("firstName"));
        assert.isDefined(model.getAttribute("lastName"));
        assert.isDefined(model.getAttribute("age"));
    });

    it("inline definition - should successfully validate basic attributes", async () => {
        let error = null;
        try {
            await model.populate({});
            await model.validate();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, ModelError);
        assert.equal(error.type, ModelError.INVALID_ATTRIBUTES);

        assert.isDefined(error.data.invalidAttributes.firstName);
        assert.isDefined(error.data.invalidAttributes.lastName);
        assert.isDefined(error.data.invalidAttributes.age);
    });

    it("inline definition - should successfully populate", async () => {
        let error = null;
        try {
            await model.populate({ firstName: "John", lastName: "Doe", age: 50 });
        } catch (e) {
            error = e;
        }

        assert.isNull(error);
    });
});
