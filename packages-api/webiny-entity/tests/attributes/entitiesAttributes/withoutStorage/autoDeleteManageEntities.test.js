import { QueryResult } from "../../../../src";
import { MainEntity, Entity1, Entity2 } from "../../../entities/entitiesAttributeEntities";
import { assert } from "chai";
import sinon from "sinon";

describe("save and delete entities attribute test", () => {
    it("should replace entities if direct assign was made or correctly update the list otherwise", async () => {
        let entityDelete = sinon
            .stub(MainEntity.getDriver(), "delete")
            .callsFake(() => new QueryResult());
        let entityFindById = sinon
            .stub(MainEntity.getDriver(), "findById")
            .callsFake(() => new QueryResult({ id: "A" }));
        let entityFind = sinon.stub(Entity1.getDriver(), "find").callsFake(() => {
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

        let entitySave = sinon
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
        assert.equal(entitySave.callCount, 2);
        assert.equal(entityDelete.callCount, 2);

        entitySave.restore();
        entityFind.restore();

        entityFind = sinon.stub(Entity1.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                {
                    id: "D",
                    firstName: "John",
                    lastName: "Doe"
                },
                {
                    id: "E",
                    firstName: "Jane",
                    lastName: "Doe"
                }
            ]);
        });

        const attribute2 = await mainEntity.get("attribute2");
        attribute2.push(new Entity2().populate({ id: "F", firstName: "Jane", lastName: "Doe" }));

        entityFind.restore();

        assert.equal(mainEntity.getAttribute("attribute2").value.initial[0].id, "D");
        assert.equal(mainEntity.getAttribute("attribute2").value.initial[1].id, "E");
        assert.lengthOf(mainEntity.getAttribute("attribute2").value.initial, 2);

        assert.equal(mainEntity.getAttribute("attribute2").value.current[0].id, "D");
        assert.equal(mainEntity.getAttribute("attribute2").value.current[1].id, "E");
        assert.equal(mainEntity.getAttribute("attribute2").value.current[2].id, "F");
        assert.lengthOf(mainEntity.getAttribute("attribute2").value.current, 3);

        await mainEntity.save();

        assert.equal(mainEntity.getAttribute("attribute2").value.initial[0].id, "D");
        assert.equal(mainEntity.getAttribute("attribute2").value.initial[1].id, "E");
        assert.equal(mainEntity.getAttribute("attribute2").value.initial[2].id, "F");
        assert.lengthOf(mainEntity.getAttribute("attribute2").value.initial, 3);

        assert.equal(mainEntity.getAttribute("attribute2").value.current[0].id, "D");
        assert.equal(mainEntity.getAttribute("attribute2").value.current[1].id, "E");
        assert.equal(mainEntity.getAttribute("attribute2").value.current[2].id, "F");
        assert.lengthOf(mainEntity.getAttribute("attribute2").value.current, 3);

        attribute2.pop();
        attribute2.pop();

        assert.equal(mainEntity.getAttribute("attribute2").value.current[0].id, "D");
        assert.lengthOf(mainEntity.getAttribute("attribute2").value.current, 1);

        entitySave = sinon
            .stub(mainEntity.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "F";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => new QueryResult());

        await mainEntity.save();

        assert.equal(entityDelete.callCount, 4);
        assert.equal(entitySave.callCount, 3);

        entityDelete.restore();
        entitySave.restore();
    });
});
