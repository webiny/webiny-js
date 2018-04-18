import { assert } from "chai";
import Entity from "./../entities/entity";
class ArrayEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("tags").array();
    }
}

ArrayEntity.classId = "ArrayEntity";

describe("array attribute test", function() {
    it("must return array, as JSON string", async () => {
        const entity = new ArrayEntity();
        entity.name = "Test";
        entity.tags = ["a", "b", "c"];

        let data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test",
            tags: '["a","b","c"]'
        });

        entity.tags = null;

        data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test",
            tags: null
        });
    });

    it("must parse JSON string from storage, and must not set attribute as dirty", async () => {
        const entity = new ArrayEntity();
        entity.getAttribute("tags").setStorageValue('["a","b","c"]');

        assert.deepEqual(entity.tags, ["a", "b", "c"]);
        assert.isFalse(entity.getAttribute("tags").value.isDirty());
        assert.isTrue(entity.getAttribute("tags").value.isSet());

        entity.getAttribute("tags").setStorageValue(null);
        assert.deepEqual(entity.tags, null);
        assert.isFalse(entity.getAttribute("tags").value.isDirty());
        assert.isTrue(entity.getAttribute("tags").value.isSet());
    });
});
