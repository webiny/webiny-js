import { assert } from "chai";
import { ComplexEntity, SimpleEntity } from "./../entities/complexEntity";

describe("entity attribute test", function() {
    it("it must populate the attribute correctly", async () => {
        const entity = new ComplexEntity();
        entity.simpleEntity = { name: "Test-1" };

        assert.instanceOf(await entity.simpleEntity, SimpleEntity);

        let linkedSimpleEntity = await entity.simpleEntity;
        assert.isNull(linkedSimpleEntity.id);
        assert.equal(linkedSimpleEntity.name, "Test-1");

        const simpleEntity = new SimpleEntity();
        simpleEntity.name = "Test-2";

        entity.simpleEntity = simpleEntity;

        linkedSimpleEntity = await entity.simpleEntity;
        assert.instanceOf(linkedSimpleEntity, SimpleEntity);
        assert.isNull(linkedSimpleEntity.id);
        assert.equal(linkedSimpleEntity.name, "Test-2");

        entity.simpleEntity = null;
        assert.isNull(await entity.simpleEntity);
    });

    it("it should return correct toStorage data", async () => {
        let entity = new ComplexEntity();
        entity.simpleEntity = { id: 1, name: "Test-1" };

        let actual = await entity.toStorage();
        let expected = {
            id: null,
            firstName: null,
            lastName: null,
            verification: null,
            tags: "[]",
            simpleEntity: 1,
            simpleEntities: "[]"
        };
        assert.deepEqual(actual, expected);

        entity = new ComplexEntity();

        actual = await entity.toStorage();
        expected = {
            id: null,
            firstName: null,
            lastName: null,
            verification: null,
            tags: "[]",
            simpleEntity: null,
            simpleEntities: "[]"
        };
        assert.deepEqual(actual, expected);
    });

    it("it should return null because no data was assigned", async () => {
        const entity = new ComplexEntity();
        assert.isNull(await entity.simpleEntity);
    });
});
