import { Entity, Driver } from "./../lib";
import { assert } from "chai";
import { EntityError } from "../lib";

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

describe("entity model missing test", function() {
    it("should throw an exception because entity model is missing", async () => {
        let error = null;
        try {
            new ExtendedEntity();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, EntityError);
        assert.equal(error.type, EntityError.MODEL_MISSING);
    });
});
