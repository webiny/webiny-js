import { QueryResult } from "@webiny/entity";
import sinon from "sinon";
import { Entity1, MainEntity } from "../../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("getValue test (without Storage)", () => {
    beforeEach(() => MainEntity.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    test("should load only once when getting value", async () => {
        const entityFindStub = sandbox.stub(MainEntity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "mainEntity" });
        });

        const mainEntity = await MainEntity.findById(123);
        entityFindStub.restore();

        const entityFindSpy = sandbox.spy(MainEntity.getDriver(), "find");

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });
        await mainEntity.attribute1;
        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: true
        });
        expect(entityFindSpy.callCount).toEqual(1);

        await mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: true
        });
        expect(entityFindSpy.callCount).toEqual(1);
    });

    test("when a new value is set, attribute should not load anything", async () => {
        const mainEntity = new MainEntity();
        mainEntity.attribute1 = [
            { id: null, name: "Enlai", type: "invalid", markedAsCannotDelete: true },
            new Entity1().populate({ id: null, name: "Bucky", type: "invalid" }),
            "something"
        ];

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });
        expect(mainEntity.getAttribute("attribute1").value.current.length).toBe(3);
        expect(typeof mainEntity.getAttribute("attribute1").value.current[0]).toBe("object");
        expect(mainEntity.getAttribute("attribute1").value.current[1]).toBeInstanceOf(Entity1);
        expect(mainEntity.getAttribute("attribute1").value.current[2]).toEqual("something");
        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });
    });

    test("when a new id is set, getting the value should return a loaded instance, or value itself if load failed", async () => {
        const mainEntity = new MainEntity();
        mainEntity.attribute1 = ["entity1", "entity2", "invalid"];

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });
        expect(mainEntity.getAttribute("attribute1").value.current.length).toBe(3);
        expect(mainEntity.getAttribute("attribute1").value.current[0]).toEqual("entity1");
        expect(mainEntity.getAttribute("attribute1").value.current[1]).toEqual("entity2");

        const entityFindOneStub = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "entity1", name: "Entity 1", type: "dog" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "entity2", name: "Entity 2", type: "cat" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult();
            });

        const entities = await mainEntity.attribute1;

        expect(entities[0]).toBeInstanceOf(Entity1);
        expect(entities[0].id).toEqual("entity1");
        expect(entities[1]).toBeInstanceOf(Entity1);
        expect(entities[1].id).toEqual("entity2");

        expect(entities[2]).toEqual("invalid");

        entityFindOneStub.restore();
        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });
    });

    test("when loading an instance from passed ID, load must happen only on first call, only if not loaded, then load", async () => {
        const mainEntity = new MainEntity();
        mainEntity.attribute1 = ["entity1", "entity2", "invalid"];

        const entityFindOneStub = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "entity1", name: "Entity 1", type: "dog" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "entity2", name: "Entity 2", type: "cat" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult();
            });

        await mainEntity.attribute1;

        expect(entityFindOneStub.callCount).toEqual(3);
        entityFindOneStub.restore();

        const entityFindOneSpy = sandbox.spy(MainEntity.getDriver(), "findOne");
        await mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;

        expect(entityFindOneSpy.callCount).toEqual(4);

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loading: false,
            loaded: false
        });
    });

    test("should get values correctly even on multiple set calls", async () => {
        const mainEntity = new MainEntity();

        mainEntity.attribute1 = [
            new Entity1().populate({ id: "one" }),
            new Entity1().populate({ id: "two" }),
            new Entity1().populate({ id: "three" })
        ];

        const attribute1 = await mainEntity.attribute1;
        expect(attribute1[0].id).toEqual("one");
        expect(attribute1[1].id).toEqual("two");
        expect(attribute1[2].id).toEqual("three");

        const attribute1Again = await mainEntity.attribute1;
        expect(attribute1Again[0].id).toEqual("one");
        expect(attribute1Again[1].id).toEqual("two");
        expect(attribute1Again[2].id).toEqual("three");
    });
});
