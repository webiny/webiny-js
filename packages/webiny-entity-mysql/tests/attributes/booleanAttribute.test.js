import { assert } from "chai";

import Entity from "./../entities/entity";
class BooleanEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("enabled").boolean();
    }
}

BooleanEntity.classId = "BooleanEntity";

describe("boolean attribute test", function() {
    it("must return boolean, as 1 or 0, or value if value is not boolean (eg. null)", async () => {
        const entity = new BooleanEntity();
        entity.name = "Test";
        entity.enabled = true;

        let data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test",
            enabled: 1
        });

        entity.enabled = false;

        data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test",
            enabled: 0
        });

        entity.enabled = null;
        data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test",
            enabled: null
        });
    });

    it("must parse JSON string from storage, and must not set attribute as dirty", async () => {
        const entity = new BooleanEntity();

        const attribute = entity.getAttribute("enabled");
        attribute.setStorageValue(0);
        assert.equal(entity.enabled, false);
        assert.isFalse(attribute.value.isDirty());
        assert.isTrue(attribute.value.isSet());

        attribute.setStorageValue(1);
        assert.equal(entity.enabled, true);
        assert.isFalse(attribute.value.isDirty());
        assert.isTrue(attribute.value.isSet());

        attribute.setStorageValue(null);
        assert.deepEqual(entity.enabled, null);
        assert.isFalse(attribute.value.isDirty());
        assert.isTrue(attribute.value.isSet());
    });
});
