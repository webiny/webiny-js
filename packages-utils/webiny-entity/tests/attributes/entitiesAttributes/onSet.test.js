import { MainEntity, Entity1 } from "../../entities/entitiesAttributeEntities";
import { EntityCollection } from "../../..";
import { assert } from "chai";

describe("onSet test", function() {
    beforeEach(() => MainEntity.getEntityPool().flush());

    it("should return value set inside onSet callback", async () => {
        const entity = new MainEntity();
        const forcedEntityCollection = new EntityCollection([
            new Entity1(),
            new Entity1(),
            new Entity1()
        ]);

        entity
            .attr("onSetTests")
            .entities(Entity1)
            .onSet(() => forcedEntityCollection);

        entity.onSetTests = [];

        assert.equal(await entity.onSetTests, forcedEntityCollection);
    });
});
