import { assert } from "chai";
import Entity from "./../entities/entity";

class ObjectEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("random").object();
    }
}

ObjectEntity.classId = "ObjectEntity";

describe("object attribute test", function() {
    it("must return object, as JSON string", async () => {
        const entity = new ObjectEntity();
        entity.name = "Test";
        entity.random = { a: 1, b: 2, c: "123", d: { x: 1, y: 5 } };

        let data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test",
            random: '{"a":1,"b":2,"c":"123","d":{"x":1,"y":5}}'
        });

        entity.random = null;

        data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test",
            random: null
        });
    });

    it("must parse JSON string from storage, and must not set attribute as dirty", async () => {
        const entity = new ObjectEntity();
        entity.getAttribute("random").setStorageValue('["a","b","c"]');

        assert.deepEqual(entity.random, ["a", "b", "c"]);
        assert.isFalse(entity.getAttribute("random").value.isDirty());
        assert.isTrue(entity.getAttribute("random").value.isSet());

        entity.getAttribute("random").setStorageValue(null);
        assert.deepEqual(entity.random, null);
        assert.isFalse(entity.getAttribute("random").value.isDirty());
        assert.isTrue(entity.getAttribute("random").value.isSet());
    });
});
