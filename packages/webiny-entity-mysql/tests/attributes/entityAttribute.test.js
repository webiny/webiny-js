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
        entity.firstName = "firstName";
        entity.lastName = "lastName";
        entity.simpleEntity = { id: "01234567890123456789adee", name: "Test-1" };

        let actual = await entity.toStorage();
        let expected = {
            firstName: "firstName",
            lastName: "lastName",
            simpleEntity: "01234567890123456789adee"
        };
        assert.deepEqual(actual, expected);
    });

    it("it should return null because no data was assigned", async () => {
        const entity = new ComplexEntity();
        assert.isNull(await entity.simpleEntity);
    });
});
