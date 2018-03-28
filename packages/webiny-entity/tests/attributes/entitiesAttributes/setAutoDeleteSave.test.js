import { MainEntity, Entity1 } from "../../entities/entitiesAttributeEntities";

import { assert } from "chai";

describe("attribute entities test", function() {
    it("should set empty EntityCollection - attributes should accept array of entities", async () => {
        const entity = new MainEntity();
        entity
            .attr("autoSaveDelete")
            .entities(Entity1)
            .setAutoDelete()
            .setAutoSave();
        let attribute = entity.getAttribute("autoSaveDelete");

        assert.equal(attribute.getAutoDelete(), true);
        assert.equal(attribute.getAutoSave(), true);

        attribute.setAutoDelete(true).setAutoSave(true);
        assert.equal(attribute.getAutoDelete(), true);
        assert.equal(attribute.getAutoSave(), true);

        attribute.setAutoDelete(false).setAutoSave(false);
        assert.equal(attribute.getAutoDelete(), false);
        assert.equal(attribute.getAutoSave(), false);

        entity
            .attr("autoSaveDeleteImmediate")
            .entities(Entity1)
            .setAutoDelete(false)
            .setAutoSave(false);
        attribute = entity.getAttribute("autoSaveDeleteImmediate");

        assert.equal(attribute.getAutoDelete(), false);
        assert.equal(attribute.getAutoSave(), false);
    });
});
