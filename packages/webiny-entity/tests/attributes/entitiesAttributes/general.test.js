import { QueryResult, EntityCollection } from "../../../src/index";
import {
    MainEntity,
    Entity1,
    Entity2,
    MainSetOnceEntity
} from "../../entities/entitiesAttributeEntities";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("attribute entities test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("if an instance of EntityCollection was passed, it should be directly assigned", async () => {
        const entity = new MainEntity();
        entity.attribute1 = new EntityCollection();

        let value = await entity.attribute1;
        expect(value.length).toBe(0);
        expect(value).toBeInstanceOf(EntityCollection);

        entity.attribute1 = new EntityCollection([new Entity1(), new Entity1()]);

        value = await entity.attribute1;
        expect(value.length).toBe(2);
        expect(value).toBeInstanceOf(EntityCollection);
    });

    test("should not change attribute1 since it has setOnce applied - attribute2 should be emptied", async () => {
        const mainSetOnceEntity = new MainSetOnceEntity();
        mainSetOnceEntity.attribute1 = [
            { name: "Enlai", type: "dog" },
            { name: "Rocky", type: "dog" },
            { name: "Lina", type: "bird" }
        ];
        mainSetOnceEntity.attribute2 = [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Jane", lastName: "Doe" }
        ];

        let attribute1 = await mainSetOnceEntity.attribute1;
        expect(attribute1[0].name).toEqual("Enlai");
        expect(attribute1[1].name).toEqual("Rocky");
        expect(attribute1[2].name).toEqual("Lina");

        mainSetOnceEntity.attribute1 = [];
        mainSetOnceEntity.attribute2 = [];

        attribute1 = await mainSetOnceEntity.attribute1;
        expect(attribute1).toBeTruthy();
        expect(attribute1[0].name).toEqual("Enlai");
        expect(attribute1[1].name).toEqual("Rocky");
        expect(attribute1[2].name).toEqual("Lina");
        expect(attribute1[3]).toBeUndefined();

        expect(await mainSetOnceEntity.attribute2).toBeEmpty();
    });

    test("should lazy load any of the accessed linked entities", async () => {
        const entityFind = sandbox.stub(MainEntity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: 10 });
        });

        const mainEntity = await MainEntity.findById(123);
        entityFind.restore();

        const entitiesFind = sandbox
            .stub(mainEntity.getDriver(), "find")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult([
                    { id: "AA", name: "Bucky", type: "dog" },
                    { id: 12, name: "Rocky", type: "dog" }
                ]);
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult([{ id: 13, firstName: "Foo", lastName: "Bar" }]);
            });

        expect(Array.isArray(mainEntity.getAttribute("attribute1").value.getCurrent())).toBe(true);
        expect(mainEntity.getAttribute("attribute1").value.getCurrent().length).toBe(0);
        expect(Array.isArray(mainEntity.getAttribute("attribute2").value.getCurrent())).toBe(true);
        expect(mainEntity.getAttribute("attribute2").value.getCurrent().length).toBe(0);

        const attribute1 = await mainEntity.attribute1;
        expect(attribute1).toBeInstanceOf(EntityCollection);
        expect(attribute1.length).toBe(2);
        expect(attribute1[0].id).toEqual("AA");
        expect(attribute1[1].id).toEqual(12);
        expect(attribute1[0]).toBeInstanceOf(Entity1);
        expect(attribute1[1]).toBeInstanceOf(Entity1);

        const attribute2 = await mainEntity.attribute2;
        expect(attribute2).toBeInstanceOf(EntityCollection);
        expect(attribute2.length).toBe(1);
        expect(attribute2[0].id).toEqual(13);
        expect(attribute2[0]).toBeInstanceOf(Entity2);

        entitiesFind.restore();
    });

    test("should set internal loaded flag to true when called for the first time, and no findById calls should be made", async () => {
        const entityFind = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: 10 });
            });

        const mainEntity = await MainEntity.findById(123);
        entityFind.restore();

        const entitiesFind = sandbox.spy(mainEntity.getDriver(), "find");

        expect(mainEntity.getAttribute("attribute1").value.getCurrent()).toBeInstanceOf(
            EntityCollection
        );
        expect(mainEntity.getAttribute("attribute1").value.getCurrent().length).toBe(0);

        mainEntity.attribute1;
        mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;
        expect(entitiesFind.callCount).toEqual(1);

        const attribute1 = await mainEntity.attribute1;
        expect(entitiesFind.callCount).toEqual(1);

        entitiesFind.restore();
        entityFind.restore();

        expect(attribute1).toBeInstanceOf(EntityCollection);
        expect(attribute1.length).toBe(0);
    });

    test("on new entities, no find calls should be made", async () => {
        const mainEntity = new MainEntity();

        const entitiesFind = sandbox.spy(mainEntity.getDriver(), "find");
        expect(mainEntity.getAttribute("attribute1").value.getCurrent()).toBeInstanceOf(
            EntityCollection
        );
        expect(mainEntity.getAttribute("attribute1").value.getCurrent().length).toBe(0);

        mainEntity.attribute1;
        mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;
        expect(entitiesFind.callCount).toEqual(0);

        const attribute1 = await mainEntity.attribute1;
        expect(entitiesFind.callCount).toEqual(0);

        entitiesFind.restore();

        expect(attribute1).toBeInstanceOf(EntityCollection);
        expect(attribute1.length).toBe(0);
    });

    test("should throw an exception", async () => {
        const mainEntity = new MainEntity();

        const entityPopulate = sandbox
            .stub(mainEntity.getAttribute("attribute1").value, "setCurrent")
            .callsFake(() => {
                throw Error("Error was thrown.");
            });

        let error = null;
        try {
            await mainEntity.set("attribute1", []);
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        entityPopulate.restore();
    });

    test("setUsing method must set all passed parameters correctly", async () => {
        const entity = new MainEntity();
        entity
            .attr("entitiesUsing")
            .entities(Entity1)
            .setUsing(Entity2, "customAttribute");

        expect(entity.getAttribute("entitiesUsing").classes).toEqual({
            entities: {
                attribute: "mainEntity",
                class: Entity1
            },
            parent: "MainEntity",
            using: {
                attribute: "customAttribute",
                class: Entity2
            }
        });
    });

    test("getJSONValue must return assigned value if not EntityCollection", async () => {
        const entity = new MainEntity();
        entity.attribute1 = 123;

        const jsonValue = await entity.getAttribute("attribute1").getJSONValue();
        expect(jsonValue).toEqual(null);
    });
});
