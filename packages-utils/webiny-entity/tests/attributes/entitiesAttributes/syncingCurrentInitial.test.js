import { EntityCollection, QueryResult } from "../../../src";
import { MainEntity, Entity1 } from "../../entities/entitiesAttributeEntities";

import { assert } from "chai";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("save and delete entities attribute test", () => {
    afterEach(() => sandbox.restore());

    it("should replace entities if direct assign was made or correctly update the list otherwise", async () => {
        let entityDelete = sandbox.spy(MainEntity.getDriver(), "delete");
        let entityFindById = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A" }));
        let entityFind = sandbox.stub(Entity1.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                { id: "B", name: "b", type: "dog", markedAsCannotDelete: false },
                { id: "C", name: "c", type: "dog", markedAsCannotDelete: false }
            ]);
        });

        const mainEntity = await MainEntity.findById(123);
        entityFindById.restore();

        await mainEntity.set("attribute1", [{ name: "x", type: "parrot" }]);

        assert.equal(mainEntity.getAttribute("attribute1").value.initial[0].id, "B");
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[1].id, "C");
        assert.equal(mainEntity.getAttribute("attribute1").value.current[0].name, "x");

        let entitySave = sandbox
            .stub(mainEntity.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "X";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => new QueryResult());

        await mainEntity.save();

        assert.lengthOf(mainEntity.getAttribute("attribute1").value.initial, 1);
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[0].id, "X");
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.current, 1);
        assert.equal(mainEntity.getAttribute("attribute1").value.current[0].id, "X");

        entitySave.restore();
        entityFind.restore();

        await mainEntity.set("attribute1", [
            { name: "y", type: "dog" },
            { name: "z", type: "parrot" }
        ]);

        assert.lengthOf(mainEntity.getAttribute("attribute1").value.initial, 1);
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[0].id, "X");
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.current, 2);
        assert.equal(mainEntity.getAttribute("attribute1").value.current[0].name, "y");
        assert.equal(mainEntity.getAttribute("attribute1").value.current[1].name, "z");

        entitySave = sandbox
            .stub(mainEntity.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "Y";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "Z";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(() => new QueryResult());

        await mainEntity.save();

        assert.lengthOf(mainEntity.getAttribute("attribute1").value.initial, 2);
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[0].id, "Y");
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[1].id, "Z");
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.current, 2);
        assert.equal(mainEntity.getAttribute("attribute1").value.current[0].id, "Y");
        assert.equal(mainEntity.getAttribute("attribute1").value.current[1].id, "Z");

        entityDelete.restore();
        entitySave.restore();

        await mainEntity.set("attribute1", null);
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.initial, 2);
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[0].id, "Y");
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[1].id, "Z");

        assert.instanceOf(mainEntity.getAttribute("attribute1").value.current, EntityCollection);
        assert.isEmpty(mainEntity.getAttribute("attribute1").value.current);
    });
});
