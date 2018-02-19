import { assert } from "chai";
import Model from "./../lib/model";
import ModelError from "./../lib/modelError";

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

describe("inline model test", function() {
    it("should return three attributes when getAttributes is called", () => {
        assert.hasAllKeys(model.getAttributes(), ["firstName", "lastName", "age"]);
    });

    it("should return attribute when called with getAttribute is called", async function() {
        assert.isDefined(model.getAttribute("firstName"));
        assert.isDefined(model.getAttribute("lastName"));
        assert.isDefined(model.getAttribute("age"));
    });

    it("should successfully validate basic attributes", async () => {
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

    it("should successfully populate", async () => {
        let error = null;
        try {
            await model.populate({ firstName: "John", lastName: "Doe", age: 50 });
        } catch (e) {
            error = e;
        }

        assert.isNull(error);
    });
});
