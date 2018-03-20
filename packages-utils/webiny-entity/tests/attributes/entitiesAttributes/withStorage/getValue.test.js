import { assert } from "chai";
import { QueryResult } from "../../../../src";
import sinon from "sinon";
import { Entity1, MainEntity } from "../../../entities/entitiesAttributeEntities";

const sandbox = sinon.sandbox.create();

describe("getValue test (with Storage)", function() {
    beforeEach(() => MainEntity.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    it("should not load anything if no ID was received from storage and attribute has toStorage set", async () => {
        const entityFindStub = sandbox.stub(MainEntity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "mainEntity" });
        });

        const mainEntity = await MainEntity.findById(123);
        mainEntity.getAttribute("attribute1").setToStorage(true);

        entityFindStub.restore();

        const entityFindSpy = sandbox.spy(MainEntity.getDriver(), "find");

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
        await mainEntity.attribute1;
        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: true
        });
        assert.equal(entityFindSpy.callCount, 0);

        await mainEntity.attribute1;
        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: true
        });
        assert.equal(entityFindSpy.callCount, 0);
    });

    it("should load only once if values are present in storage", async () => {
        const entityFindOneStub = sandbox.stub(MainEntity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "mainEntity" });
        });

        const mainEntity = await MainEntity.findById(123);
        mainEntity
            .getAttribute("attribute1")
            .setToStorage(true)
            .setStorageValue(["entity1", "entity2"]);

        entityFindOneStub.restore();

        const entityFindStub = sandbox.stub(MainEntity.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                { id: "entity1", name: "Entity 1" },
                { id: "entity2", name: "Entity 2" }
            ]);
        });

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
        await mainEntity.attribute1;
        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: true
        });
        assert.equal(entityFindStub.callCount, 1);

        await mainEntity.attribute1;
        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: true
        });
        assert.equal(entityFindStub.callCount, 1);

        entityFindStub.restore();
    });

    it("when a new value is set, attribute should not load anything even though storage value exists", async () => {
        const entityFindOneStub = sandbox.stub(MainEntity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "mainEntity" });
        });

        const mainEntity = await MainEntity.findById(123);
        mainEntity
            .getAttribute("attribute1")
            .setToStorage(true)
            .setStorageValue(["entity1", "entity2"]);

        entityFindOneStub.restore();

        mainEntity.attribute1 = [
            { id: null, name: "Enlai", type: "invalid", markedAsCannotDelete: true },
            new Entity1().populate({ id: null, name: "Bucky", type: "invalid" }),
            "something"
        ];

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.current, 3);
        assert.isObject(mainEntity.getAttribute("attribute1").value.current[0]);
        assert.instanceOf(mainEntity.getAttribute("attribute1").value.current[1], Entity1);
        assert.equal(mainEntity.getAttribute("attribute1").value.current[2], "something");

        assert.lengthOf(mainEntity.getAttribute("attribute1").value.initial, 2);
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[0], "entity1");
        assert.equal(mainEntity.getAttribute("attribute1").value.initial[1], "entity2");

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
    });

    it("when a new id is set, getting the value should return a loaded instance", async () => {
        const mainEntity = new MainEntity();
        mainEntity
            .getAttribute("attribute1")
            .setToStorage(true)
            .setStorageValue(["entityX", "entityY"]);

        mainEntity.attribute1 = ["entity1", "entity2"];

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.current, 2);
        assert.equal(mainEntity.getAttribute("attribute1").value.current[0], "entity1");
        assert.equal(mainEntity.getAttribute("attribute1").value.current[1], "entity2");

        const entityFindOneStub = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "entity1", name: "Entity 1", type: "dog" });
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult({ id: "entity2", name: "Entity 2", type: "cat" });
            });

        const entities = await mainEntity.attribute1;

        assert.instanceOf(entities[0], Entity1);
        assert.equal(entities[0].id, "entity1");
        assert.instanceOf(entities[1], Entity1);
        assert.equal(entities[1].id, "entity2");

        entityFindOneStub.restore();
        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
    });

    it("when an invalid id is set, getting the value should return initially set value", async () => {
        const mainEntity = new MainEntity();
        mainEntity.getAttribute("attribute1").setToStorage(true);

        mainEntity.attribute1 = ["entity1", "entity2", "invalid"];

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.current, 3);
        assert.equal(mainEntity.getAttribute("attribute1").value.current[0], "entity1");
        assert.equal(mainEntity.getAttribute("attribute1").value.current[1], "entity2");

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

        assert.instanceOf(entities[0], Entity1);
        assert.equal(entities[0].id, "entity1");
        assert.instanceOf(entities[1], Entity1);
        assert.equal(entities[1].id, "entity2");

        assert.equal(entities[2], "invalid");

        entityFindOneStub.restore();
        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
    });

    it("when loading an instance from passed ID, load must happen only on first call (only if not loaded, then load)", async () => {
        const mainEntity = new MainEntity();
        mainEntity.getAttribute("attribute1").setToStorage(true);

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

        assert.equal(entityFindOneStub.callCount, 3);
        entityFindOneStub.restore();

        const entityFindOneSpy = sandbox.spy(MainEntity.getDriver(), "findOne");
        await mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;

        assert.equal(entityFindOneSpy.callCount, 4);

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loading: false,
            loaded: false
        });
    });

    it("should get values correctly even on multiple set calls", async () => {
        const mainEntity = new MainEntity();
        mainEntity.getAttribute("attribute1").setToStorage(true);

        mainEntity.attribute1 = [
            new Entity1().populate({ id: "one" }),
            new Entity1().populate({ id: "two" }),
            new Entity1().populate({ id: "three" })
        ];

        const attribute1 = await mainEntity.attribute1;
        assert.equal(attribute1[0].id, "one");
        assert.equal(attribute1[1].id, "two");
        assert.equal(attribute1[2].id, "three");

        const attribute1Again = await mainEntity.attribute1;
        assert.equal(attribute1Again[0].id, "one");
        assert.equal(attribute1Again[1].id, "two");
        assert.equal(attribute1Again[2].id, "three");
    });
});
