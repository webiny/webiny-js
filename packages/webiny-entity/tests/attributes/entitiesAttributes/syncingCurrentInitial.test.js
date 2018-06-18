import { QueryResult } from "../../../src";
import { MainEntity, Entity1 } from "../../entities/entitiesAttributeEntities";

import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("save and delete entities attribute test", () => {
    afterEach(() => sandbox.restore());

    test("should replace entities if direct assign was made or correctly update the list otherwise", async () => {
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

        mainEntity.attribute1 = [{ name: "x", type: "parrot" }];

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });

        const value = mainEntity.getAttribute("attribute1").value;
        expect(value.initial.length).toBe(0);
        expect(value.current[0].name).toEqual("x");

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

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: true
        });

        expect(mainEntity.getAttribute("attribute1").value.initial.length).toBe(1);
        expect(mainEntity.getAttribute("attribute1").value.initial[0].id).toEqual("X");
        expect(mainEntity.getAttribute("attribute1").value.current.length).toBe(1);
        expect(mainEntity.getAttribute("attribute1").value.current[0].id).toEqual("X");

        entitySave.restore();
        entityFind.restore();

        mainEntity.attribute1 = [{ name: "y", type: "dog" }, { name: "z", type: "parrot" }];

        expect(mainEntity.getAttribute("attribute1").value.initial.length).toBe(1);
        expect(mainEntity.getAttribute("attribute1").value.initial[0].id).toEqual("X");
        expect(mainEntity.getAttribute("attribute1").value.current.length).toBe(2);
        expect(mainEntity.getAttribute("attribute1").value.current[0].name).toEqual("y");
        expect(mainEntity.getAttribute("attribute1").value.current[1].name).toEqual("z");

        entitySave = sandbox
            .stub(mainEntity.getDriver(), "save")
            .onCall(1)
            .callsFake(entity => {
                entity.id = "Y";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "Z";
                return new QueryResult();
            })
            .onCall(0)
            .callsFake(() => new QueryResult());

        await mainEntity.save();

        expect(mainEntity.getAttribute("attribute1").value.initial.length).toBe(2);
        expect(mainEntity.getAttribute("attribute1").value.initial[0].id).toEqual("Y");
        expect(mainEntity.getAttribute("attribute1").value.initial[1].id).toEqual("Z");
        expect(mainEntity.getAttribute("attribute1").value.current.length).toBe(2);
        expect(mainEntity.getAttribute("attribute1").value.current[0].id).toEqual("Y");
        expect(mainEntity.getAttribute("attribute1").value.current[1].id).toEqual("Z");

        entitySave.restore();

        mainEntity.attribute1 = null;
        expect(mainEntity.getAttribute("attribute1").value.initial.length).toBe(2);
        expect(mainEntity.getAttribute("attribute1").value.initial[0].id).toEqual("Y");
        expect(mainEntity.getAttribute("attribute1").value.initial[1].id).toEqual("Z");

        expect(mainEntity.getAttribute("attribute1").value.current).toBeNull();
    });
});
