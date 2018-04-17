import { assert } from "chai";
import { ComplexEntity, SimpleEntity } from "./../entities/complexEntity";

describe("entity attribute test", function() {
    it("it must populate the attribute correctly (setToStorage enabled)", async () => {
        const entity = new ComplexEntity();
        entity.simpleEntities = [{ name: "Test-1" }, { name: "Test-2" }, { name: "Test-3" }];

        let simpleEntities = await entity.simpleEntities;
        assert.lengthOf(simpleEntities, 3);
        assert.instanceOf(simpleEntities[0], SimpleEntity);
        assert.instanceOf(simpleEntities[1], SimpleEntity);
        assert.instanceOf(simpleEntities[2], SimpleEntity);
        assert.isNull(simpleEntities[0].id);
        assert.isNull(simpleEntities[1].id);
        assert.isNull(simpleEntities[2].id);
        assert.equal(simpleEntities[0].name, "Test-1");
        assert.equal(simpleEntities[1].name, "Test-2");
        assert.equal(simpleEntities[2].name, "Test-3");

        const simpleEntity1 = new SimpleEntity();
        simpleEntity1.name = "Test-1";

        const simpleEntity2 = new SimpleEntity();
        simpleEntity2.name = "Test-2";

        const simpleEntity3 = new SimpleEntity();
        simpleEntity3.name = "Test-3";

        entity.simpleEntities = [simpleEntity1, simpleEntity2, simpleEntity3];

        simpleEntities = await entity.simpleEntities;

        assert.lengthOf(simpleEntities, 3);
        assert.instanceOf(simpleEntities[0], SimpleEntity);
        assert.instanceOf(simpleEntities[1], SimpleEntity);
        assert.instanceOf(simpleEntities[2], SimpleEntity);
        assert.isNull(simpleEntities[0].id);
        assert.isNull(simpleEntities[1].id);
        assert.isNull(simpleEntities[2].id);
        assert.equal(simpleEntities[0].name, "Test-1");
        assert.equal(simpleEntities[1].name, "Test-2");
        assert.equal(simpleEntities[2].name, "Test-3");

        entity.simpleEntities = null;
        assert.isNull(await entity.simpleEntities);
    });

    it("it null is set, it should accept it", async () => {
        const entity = new ComplexEntity();
        entity.simpleEntities = [{ name: "Test-1" }, { name: "Test-2" }, { name: "Test-3" }];
        entity.simpleEntities = null;
        assert.isNull(await entity.simpleEntities);
    });

    it("it should return correct toStorage data", async () => {
        let entity = new ComplexEntity();
        entity.simpleEntities = [
            { id: "54759eb3c090d83494e2d804", name: "Test-1" },
            { id: "54759eb3c090d83494e2d805", name: "Test-2" },
            { id: "54759eb3c090d83494e2d806", name: "Test-3" }
        ];

        let actual = await entity.toStorage();
        let expected = {
            simpleEntities: `["54759eb3c090d83494e2d804","54759eb3c090d83494e2d805","54759eb3c090d83494e2d806"]`
        };
        assert.deepEqual(actual, expected);

        entity = new ComplexEntity();
        actual = await entity.toStorage();
        expected = {};
        assert.deepEqual(actual, expected);
    });

    it("it should return null because no data was assigned", async () => {
        const entity = new ComplexEntity();
        assert.isNull(await entity.simpleEntity);
    });
});
