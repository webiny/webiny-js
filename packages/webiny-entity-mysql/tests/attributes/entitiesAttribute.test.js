import { assert } from "chai";
import { EntityCollection } from "webiny-entity";
import { ComplexEntity, SimpleEntity } from "./../entities/complexEntity";
import sinon from "sinon";
import User from "webiny-entity/tests/entities/user";

const sandbox = sinon.sandbox.create();

describe("entities attribute test", function() {
    beforeEach(() => User.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    it("it must populate the attribute correctly", async () => {
        const entity = new ComplexEntity();
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });

        entity.simpleEntitiesLoadedFromTable = [
            { name: "Test-1" },
            { name: "Test-2" },
            { name: "Test-3" }
        ];

        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });

        let simpleEntities = await entity.simpleEntitiesLoadedFromTable;
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });

        assert.lengthOf(simpleEntities, 3);
        assert.instanceOf(simpleEntities[0], SimpleEntity);
        assert.instanceOf(simpleEntities[1], SimpleEntity);
        assert.instanceOf(simpleEntities[2], SimpleEntity);
        assert.isNull(simpleEntities[0].id);
        assert.isNull(simpleEntities[1].id);
        assert.isNull(simpleEntities[2].id);
        assert.equal(simpleEntities[0].name, "Test-1");
        assert.equal(simpleEntities[1].name, "Test-2");
        assert.equal(simpleEntities[2].name, "Test-3");

        const simpleEntity1 = new SimpleEntity();
        simpleEntity1.name = "Test-1";

        const simpleEntity2 = new SimpleEntity();
        simpleEntity2.name = "Test-2";

        const simpleEntity3 = new SimpleEntity();
        simpleEntity3.name = "Test-3";

        entity.simpleEntitiesLoadedFromTable = [simpleEntity1, simpleEntity2, simpleEntity3];
        await entity.simpleEntitiesLoadedFromTable;
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });

        simpleEntities = await entity.simpleEntitiesLoadedFromTable;
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });

        assert.lengthOf(simpleEntities, 3);
        assert.instanceOf(simpleEntities[0], SimpleEntity);
        assert.instanceOf(simpleEntities[1], SimpleEntity);
        assert.instanceOf(simpleEntities[2], SimpleEntity);
        assert.isNull(simpleEntities[0].id);
        assert.isNull(simpleEntities[1].id);
        assert.isNull(simpleEntities[2].id);
        assert.equal(simpleEntities[0].name, "Test-1");
        assert.equal(simpleEntities[1].name, "Test-2");
        assert.equal(simpleEntities[2].name, "Test-3");

        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });
        entity.simpleEntitiesLoadedFromTable = null;

        assert.isNull(await entity.simpleEntitiesLoadedFromTable);
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });
    });

    it("it null is set, it should accept it", async () => {
        const entity = new ComplexEntity();

        entity.simpleEntitiesLoadedFromTable = [
            { name: "Test-1" },
            { name: "Test-2" },
            { name: "Test-3" }
        ];
        entity.simpleEntitiesLoadedFromTable = null;
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });
        assert.lengthOf(entity.getAttribute("simpleEntitiesLoadedFromTable").value.queue, 0);

        assert.isNull(await entity.simpleEntitiesLoadedFromTable);
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });
    });

    it("it should return correct toStorage data", async () => {
        let entity = new ComplexEntity();
        entity.simpleEntitiesLoadedFromTable = [
            { id: 1, name: "Test-1" },
            { id: 2, name: "Test-2" },
            { id: 3, name: "Test-3" }
        ];

        entity.simpleEntities = [];

        let actual = await entity.toStorage();
        let expected = {
            simpleEntities: "[]"
        };
        assert.deepEqual(actual, expected);

        entity = new ComplexEntity();
        actual = await entity.toStorage();
        expected = {};
        assert.deepEqual(actual, expected);
    });

    it("should return EntityCollection which is the default value of the attribute", async () => {
        const entity = new ComplexEntity();
        assert.instanceOf(await entity.simpleEntitiesLoadedFromTable, EntityCollection);
    });

    it("should load entities from another table - only when the attribute is actually accessed", async () => {
        sandbox
            .stub(ComplexEntity.getDriver().getConnection(), "query")
            .onCall(0)
            .callsFake(() => {
                return [
                    {
                        id: 1,
                        name: "This is a test",
                        slug: "thisIsATest",
                        enabled: 1
                    }
                ];
            })
            .onCall(1)
            .callsFake(() => {
                return [
                    [
                        {
                            id: 2,
                            name: "This is a test B",
                            slug: "thisIsATestB",
                            enabled: 1
                        },
                        {
                            id: 3,
                            name: "This is a test C",
                            slug: "thisIsATestC",
                            enabled: 1
                        },
                        {
                            id: 4,
                            name: "This is a test D",
                            slug: "thisIsATestD",
                            enabled: 1
                        }
                    ],
                    [{ count: 3 }]
                ];
            });

        const entity = await ComplexEntity.findOne();
        assert.equal(entity.id, 1);

        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });
        assert.instanceOf(
            entity.getAttribute("simpleEntitiesLoadedFromTable").value.getCurrent(),
            EntityCollection
        );
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: false
        });

        // After getting the attribute, let's check if everything was loaded correctly.
        const simpleEntities = await entity.simpleEntitiesLoadedFromTable;
        assert.deepEqual(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state, {
            loading: false,
            loaded: true
        });

        assert.lengthOf(simpleEntities, 3);
        assert.instanceOf(simpleEntities[0], SimpleEntity);
        assert.instanceOf(simpleEntities[1], SimpleEntity);
        assert.instanceOf(simpleEntities[2], SimpleEntity);
        assert.equal(simpleEntities[0].id, 2);
        assert.equal(simpleEntities[1].id, 3);
        assert.equal(simpleEntities[2].id, 4);
        assert.equal(simpleEntities[0].name, "This is a test B");
        assert.equal(simpleEntities[1].name, "This is a test C");
        assert.equal(simpleEntities[2].name, "This is a test D");

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    it("when saving main entity, it should save linked entities only if auto save is enabled", async () => {
        const entity = new ComplexEntity();
        entity.populate({
            name: "This is a test",
            slug: "thisIsATest",
            enabled: 1,
            simpleEntitiesLoadedFromTable: [
                { name: "Test-1" },
                { name: "Test-2" },
                { name: "Test-3" }
            ]
        });

        sandbox.stub(entity.getDriver().getConnection(), "query").callsFake(() => {});

        let generateIDStub = sandbox
            .stub(entity.getDriver().constructor, "__generateID")
            .onCall(0)
            .callsFake(() => {
                return "one";
            });

        await entity.save();
        generateIDStub.restore();

        entity
            .getDriver()
            .getConnection()
            .query.restore();

        assert.equal(entity.id, "one");
        assert.isTrue(entity.getAttribute("id").value.isClean());

        let simpleEntities = await entity.simpleEntitiesLoadedFromTable;
        assert.instanceOf(simpleEntities[0], SimpleEntity);
        assert.instanceOf(simpleEntities[1], SimpleEntity);
        assert.instanceOf(simpleEntities[2], SimpleEntity);

        assert.isNull(simpleEntities[0].id);
        assert.isNull(simpleEntities[1].id);
        assert.isNull(simpleEntities[2].id);

        simpleEntities[0].name = "Test-1-UPDATE";
        simpleEntities[1].name = "Test-2-UPDATE";
        simpleEntities[2].name = "Test-3-UPDATE";

        assert.isTrue(entity.getAttribute("simpleEntitiesLoadedFromTable").value.isDirty());

        // Now let's try to save entity with auto save enabled on "simpleEntitiesLoadedFromTable" attribute.
        entity.getAttribute("simpleEntitiesLoadedFromTable").setAutoSave();

        const entitySave = sandbox
            .stub(ComplexEntity.getDriver().getConnection(), "query")
            .onCall(1)
            .callsFake(() => {
                return { insertId: 4 };
            })
            .onCall(2)
            .callsFake(() => {
                return { insertId: 3 };
            })
            .onCall(3)
            .callsFake(() => {
                return { insertId: 2 };
            })
            .onCall(0)
            .callsFake(() => {
                return {};
            });

        generateIDStub = sandbox
            .stub(ComplexEntity.getDriver().constructor, "__generateID")
            .onCall(0)
            .callsFake(() => {
                return "four";
            })
            .onCall(1)
            .callsFake(() => {
                return "three";
            })
            .onCall(2)
            .callsFake(() => {
                return "two";
            });

        await entity.save();

        assert.equal(entitySave.callCount, 3);

        entity
            .getDriver()
            .getConnection()
            .query.restore();

        assert.equal(entity.id, "one");
        assert.isTrue(entity.getAttribute("id").value.isClean());
        assert.isTrue(entity.getAttribute("simpleEntitiesLoadedFromTable").value.isClean());

        simpleEntities = await entity.simpleEntitiesLoadedFromTable;

        assert.instanceOf(simpleEntities[0], SimpleEntity);
        assert.instanceOf(simpleEntities[1], SimpleEntity);
        assert.instanceOf(simpleEntities[2], SimpleEntity);

        assert.equal(simpleEntities[2].id, "two");
        assert.equal(simpleEntities[1].id, "three");
        assert.equal(simpleEntities[0].id, "four");

        generateIDStub.restore();
    });
});
