import { assert } from "chai";
import Model from "./../src/model";
import DefaultAttributesContainer from "./../src/defaultAttributesContainer";

class DefaultAttributesContainerOverride extends DefaultAttributesContainer {
    newAttribute() {
        return 5;
    }
}

class ModelOverride extends Model {
    createAttributesContainer() {
        return new DefaultAttributesContainerOverride(this);
    }
}

const model = new ModelOverride();

describe("overriding attributes container test", function() {
    it("old methods should work", () => {
        assert.isFunction(model.getAttributesContainer().boolean);
        assert.isFunction(model.getAttributesContainer().char);
        assert.isFunction(model.getAttributesContainer().integer);
    });

    it("new method should work", () => {
        assert.isFunction(model.getAttributesContainer().newAttribute);
        assert.equal(model.getAttributesContainer().newAttribute(), 5);
    });
});
