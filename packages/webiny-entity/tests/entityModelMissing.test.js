import { Entity, Driver } from "./../src";
import { EntityError } from "../src";

class ExtendedEntityDriver extends Driver {
    constructor() {
        super();
    }

    getModelClass() {
        return null;
    }
}

class ExtendedEntity extends Entity {}

ExtendedEntity.driver = new ExtendedEntityDriver();

describe("entity model missing test", () => {
    test("should throw an exception because entity model is missing", async () => {
        let error = null;
        try {
            new ExtendedEntity();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(EntityError);
        expect(error.code).toEqual(EntityError.MODEL_MISSING);
    });
});
