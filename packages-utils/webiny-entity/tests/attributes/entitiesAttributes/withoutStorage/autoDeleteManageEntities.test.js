import { QueryResult } from "../../../../lib";
import { MainEntity, Entity1, Entity2 } from "../../../entities/entitiesAttributeEntities";
import { assert } from "chai";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("entity attribute current / initial values syncing", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    it("should delete previous initial values since auto save and auto delete are both enabled", async () => {
        let entityDelete = sandbox
            .stub(MainEntity.getDriver(), "delete")
            .callsFake(() => new QueryResult());
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
        assert.equal(entitySave.callCount, 2);
        assert.equal(entityDelete.callCount, 2);

        entitySave.restore();
        entityFind.restore();

        entityFind = sandbox.stub(Entity1.getDriver(), "find").callsFake(() => {
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

        entitySave = sandbox
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
