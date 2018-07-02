import { EntityCollection } from "webiny-entity";
import { ComplexEntity, SimpleEntity } from "./../entities/complexEntity";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("entities attribute test", () => {
    beforeEach(() => ComplexEntity.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    test("it must populate the attribute correctly", async () => {
        const entity = new ComplexEntity();
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });

        entity.simpleEntitiesLoadedFromTable = [
            { name: "Test-1" },
            { name: "Test-2" },
            { name: "Test-3" }
        ];

        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });

        let simpleEntities = await entity.simpleEntitiesLoadedFromTable;
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });

        expect(simpleEntities.length).toBe(3);
        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[0].id).toBeNull();
        expect(simpleEntities[1].id).toBeNull();
        expect(simpleEntities[2].id).toBeNull();
        expect(simpleEntities[0].name).toEqual("Test-1");
        expect(simpleEntities[1].name).toEqual("Test-2");
        expect(simpleEntities[2].name).toEqual("Test-3");

        const simpleEntity1 = new SimpleEntity();
        simpleEntity1.name = "Test-1";

        const simpleEntity2 = new SimpleEntity();
        simpleEntity2.name = "Test-2";

        const simpleEntity3 = new SimpleEntity();
        simpleEntity3.name = "Test-3";

        entity.simpleEntitiesLoadedFromTable = [simpleEntity1, simpleEntity2, simpleEntity3];
        await entity.simpleEntitiesLoadedFromTable;
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });

        simpleEntities = await entity.simpleEntitiesLoadedFromTable;
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });

        expect(simpleEntities.length).toBe(3);
        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[0].id).toBeNull();
        expect(simpleEntities[1].id).toBeNull();
        expect(simpleEntities[2].id).toBeNull();
        expect(simpleEntities[0].name).toEqual("Test-1");
        expect(simpleEntities[1].name).toEqual("Test-2");
        expect(simpleEntities[2].name).toEqual("Test-3");

        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });
        entity.simpleEntitiesLoadedFromTable = null;

        expect(await entity.simpleEntitiesLoadedFromTable).toBeNull();
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });
    });

    test("it null is set, it should accept it", async () => {
        const entity = new ComplexEntity();

        entity.simpleEntitiesLoadedFromTable = [
            { name: "Test-1" },
            { name: "Test-2" },
            { name: "Test-3" }
        ];
        entity.simpleEntitiesLoadedFromTable = null;
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.queue.length).toBe(0);

        expect(await entity.simpleEntitiesLoadedFromTable).toBeNull();
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });
    });

    test("should return EntityCollection which is the default value of the attribute", async () => {
        const entity = new ComplexEntity();
        expect(await entity.simpleEntitiesLoadedFromTable).toBeInstanceOf(EntityCollection);
    });

    test("should load entities from another table - only when the attribute is actually accessed", async () => {
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
        expect(entity.id).toEqual(1);

        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });
        expect(
            entity.getAttribute("simpleEntitiesLoadedFromTable").value.getCurrent()
        ).toBeInstanceOf(EntityCollection);
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: false
        });

        // After getting the attribute, let's check if everything was loaded correctly.
        const simpleEntities = await entity.simpleEntitiesLoadedFromTable;
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.state).toEqual({
            loading: false,
            loaded: true
        });

        expect(simpleEntities.length).toBe(3);
        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[0].id).toEqual(2);
        expect(simpleEntities[1].id).toEqual(3);
        expect(simpleEntities[2].id).toEqual(4);
        expect(simpleEntities[0].name).toEqual("This is a test B");
        expect(simpleEntities[1].name).toEqual("This is a test C");
        expect(simpleEntities[2].name).toEqual("This is a test D");

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    test("when saving main entity, it should save linked entities only if auto save is enabled", async () => {
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

        expect(entity.id).toEqual("one");
        expect(entity.getAttribute("id").value.isClean()).toBe(true);

        let simpleEntities = await entity.simpleEntitiesLoadedFromTable;
        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);

        expect(simpleEntities[0].id).toBeNull();
        expect(simpleEntities[1].id).toBeNull();
        expect(simpleEntities[2].id).toBeNull();

        simpleEntities[0].name = "Test-1-UPDATE";
        simpleEntities[1].name = "Test-2-UPDATE";
        simpleEntities[2].name = "Test-3-UPDATE";

        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.isDirty()).toBe(true);

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

        expect(entitySave.callCount).toEqual(3);

        entity
            .getDriver()
            .getConnection()
            .query.restore();

        expect(entity.id).toEqual("one");
        expect(entity.getAttribute("id").value.isClean()).toBe(true);
        expect(entity.getAttribute("simpleEntitiesLoadedFromTable").value.isClean()).toBe(true);

        simpleEntities = await entity.simpleEntitiesLoadedFromTable;

        expect(simpleEntities[0]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[1]).toBeInstanceOf(SimpleEntity);
        expect(simpleEntities[2]).toBeInstanceOf(SimpleEntity);

        expect(simpleEntities[2].id).toEqual("two");
        expect(simpleEntities[1].id).toEqual("three");
        expect(simpleEntities[0].id).toEqual("four");

        generateIDStub.restore();
    });
});
