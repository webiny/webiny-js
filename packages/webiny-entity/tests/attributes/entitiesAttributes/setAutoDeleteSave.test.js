import { MainEntity, Entity1 } from "../../entities/entitiesAttributeEntities";

describe("attribute entities test", () => {
    test("should set empty EntityCollection - attributes should accept array of entities", async () => {
        const entity = new MainEntity();
        entity
            .attr("autoSaveDelete")
            .entities(Entity1)
            .setAutoDelete()
            .setAutoSave();
        let attribute = entity.getAttribute("autoSaveDelete");

        expect(attribute.getAutoDelete()).toEqual(true);
        expect(attribute.getAutoSave()).toEqual(true);

        attribute.setAutoDelete(true).setAutoSave(true);
        expect(attribute.getAutoDelete()).toEqual(true);
        expect(attribute.getAutoSave()).toEqual(true);

        attribute.setAutoDelete(false).setAutoSave(false);
        expect(attribute.getAutoDelete()).toEqual(false);
        expect(attribute.getAutoSave()).toEqual(false);

        entity
            .attr("autoSaveDeleteImmediate")
            .entities(Entity1)
            .setAutoDelete(false)
            .setAutoSave(false);
        attribute = entity.getAttribute("autoSaveDeleteImmediate");

        expect(attribute.getAutoDelete()).toEqual(false);
        expect(attribute.getAutoSave()).toEqual(false);
    });
});
