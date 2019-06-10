import { Model } from "webiny-model";
import DefaultAttributesContainer from "webiny-model/defaultAttributesContainer";

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

describe("overriding attributes container test", () => {
    test("old methods should work", () => {
        expect(typeof model.getAttributesContainer().boolean).toBe("function");
        expect(typeof model.getAttributesContainer().char).toBe("function");
        expect(typeof model.getAttributesContainer().integer).toBe("function");
    });

    test("new method should work", () => {
        expect(typeof model.getAttributesContainer().newAttribute).toBe("function");
        expect(model.getAttributesContainer().newAttribute()).toEqual(5);
    });
});
