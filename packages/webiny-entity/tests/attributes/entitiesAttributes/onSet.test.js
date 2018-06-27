import { MainEntity, Entity1 } from "../../entities/entitiesAttributeEntities";
import { EntityCollection } from "../../../src";

describe("onSet test", () => {
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("should return value set inside onSet callback", async () => {
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

        expect(await entity.onSetTests).toEqual(forcedEntityCollection);
    });
});
