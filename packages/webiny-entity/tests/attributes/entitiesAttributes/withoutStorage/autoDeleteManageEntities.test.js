import { QueryResult } from "../../../../src";
import { MainEntity, Entity1, Entity2 } from "../../../entities/entitiesAttributeEntities";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("entity attribute current / initial values syncing", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("should delete previous initial values since auto save and auto delete are both enabled", async () => {
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

        expect(mainEntity.getAttribute("attribute1").value.initial[0]).not.toBeDefined();
        expect(mainEntity.getAttribute("attribute1").value.initial[1]).not.toBeDefined();

        let entitySave = sandbox
            .stub(mainEntity.getDriver(), "save")
            .onCall(1)
            .callsFake(entity => {
                entity.id = "X";
                return new QueryResult();
            })
            .onCall(0)
            .callsFake(() => new QueryResult());

        await mainEntity.save();

        expect(mainEntity.getAttribute("attribute1").value.initial.length).toBe(1);
        expect(mainEntity.getAttribute("attribute1").value.initial[0].id).toEqual("X");
        expect(mainEntity.getAttribute("attribute1").value.current.length).toBe(1);
        expect(mainEntity.getAttribute("attribute1").value.current[0].id).toEqual("X");
        expect(entitySave.callCount).toEqual(2);
        expect(entityDelete.callCount).toEqual(2);

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

        expect(mainEntity.getAttribute("attribute2").value.initial[0].id).toEqual("D");
        expect(mainEntity.getAttribute("attribute2").value.initial[1].id).toEqual("E");
        expect(mainEntity.getAttribute("attribute2").value.initial.length).toBe(2);

        expect(mainEntity.getAttribute("attribute2").value.current[0].id).toEqual("D");
        expect(mainEntity.getAttribute("attribute2").value.current[1].id).toEqual("E");
        expect(mainEntity.getAttribute("attribute2").value.current[2].id).toEqual("F");
        expect(mainEntity.getAttribute("attribute2").value.current.length).toBe(3);

        await mainEntity.save();

        expect(mainEntity.getAttribute("attribute2").value.initial[0].id).toEqual("D");
        expect(mainEntity.getAttribute("attribute2").value.initial[1].id).toEqual("E");
        expect(mainEntity.getAttribute("attribute2").value.initial[2].id).toEqual("F");
        expect(mainEntity.getAttribute("attribute2").value.initial.length).toBe(3);

        expect(mainEntity.getAttribute("attribute2").value.current[0].id).toEqual("D");
        expect(mainEntity.getAttribute("attribute2").value.current[1].id).toEqual("E");
        expect(mainEntity.getAttribute("attribute2").value.current[2].id).toEqual("F");
        expect(mainEntity.getAttribute("attribute2").value.current.length).toBe(3);

        attribute2.pop();
        attribute2.pop();

        expect(mainEntity.getAttribute("attribute2").value.current[0].id).toEqual("D");
        expect(mainEntity.getAttribute("attribute2").value.current.length).toBe(1);

        entitySave = sandbox
            .stub(mainEntity.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "F";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(() => new QueryResult());

        mainEntity.attribute2 = [...attribute2]; // Force dirty check, since it's not the same array.
        await mainEntity.save();

        expect(entityDelete.callCount).toEqual(4);
        expect(entitySave.callCount).toEqual(1);

        entityDelete.restore();
        entitySave.restore();
    });
});
