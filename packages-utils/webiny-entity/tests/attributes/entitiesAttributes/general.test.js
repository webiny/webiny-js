import { QueryResult, EntityCollection } from "../../../lib/index";
import {
    MainEntity,
    Entity1,
    Entity2,
    MainSetOnceEntity
} from "../../entities/entitiesAttributeEntities";
import { assert, expect } from "chai";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("attribute entities test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    it("if an instance of EntityCollection was passed, it should be directly assigned", async () => {
        const entity = new MainEntity();
        entity.attribute1 = new EntityCollection();

        let value = await entity.attribute1;
        assert.empty(value);
        assert.instanceOf(value, EntityCollection);

        entity.attribute1 = new EntityCollection([new Entity1(), new Entity1()]);

        value = await entity.attribute1;
        assert.lengthOf(value, 2);
        assert.instanceOf(value, EntityCollection);
    });

    it("should not change attribute1 since it has setOnce applied - attribute2 should be emptied", async () => {
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
        assert.equal(attribute1[0].name, "Enlai");
        assert.equal(attribute1[1].name, "Rocky");
        assert.equal(attribute1[2].name, "Lina");

        mainSetOnceEntity.attribute1 = [];
        mainSetOnceEntity.attribute2 = [];

        attribute1 = await mainSetOnceEntity.attribute1;
        assert.notEmpty(attribute1);
        assert.equal(attribute1[0].name, "Enlai");
        assert.equal(attribute1[1].name, "Rocky");
        assert.equal(attribute1[2].name, "Lina");
        assert.isUndefined(attribute1[3]);

        assert.isEmpty(await mainSetOnceEntity.attribute2);
    });

    it("should lazy load any of the accessed linked entities", async () => {
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

        assert.isArray(mainEntity.getAttribute("attribute1").value.getCurrent());
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.getCurrent(), 0);
        assert.isArray(mainEntity.getAttribute("attribute2").value.getCurrent());
        assert.lengthOf(mainEntity.getAttribute("attribute2").value.getCurrent(), 0);

        const attribute1 = await mainEntity.attribute1;
        assert.instanceOf(attribute1, EntityCollection);
        assert.lengthOf(attribute1, 2);
        assert.equal(attribute1[0].id, "AA");
        assert.equal(attribute1[1].id, 12);
        assert.instanceOf(attribute1[0], Entity1);
        assert.instanceOf(attribute1[1], Entity1);

        const attribute2 = await mainEntity.attribute2;
        assert.instanceOf(attribute2, EntityCollection);
        assert.lengthOf(attribute2, 1);
        assert.equal(attribute2[0].id, 13);
        assert.instanceOf(attribute2[0], Entity2);

        entitiesFind.restore();
    });

    it("should set internal loaded flag to true when called for the first time, and no findById calls should be made", async () => {
        const entityFind = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: 10 });
            });

        const mainEntity = await MainEntity.findById(123);
        entityFind.restore();

        const entitiesFind = sandbox.spy(mainEntity.getDriver(), "find");

        assert.instanceOf(
            mainEntity.getAttribute("attribute1").value.getCurrent(),
            EntityCollection
        );
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.getCurrent(), 0);

        mainEntity.attribute1;
        mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;
        assert.equal(entitiesFind.callCount, 1);

        const attribute1 = await mainEntity.attribute1;
        assert.equal(entitiesFind.callCount, 1);

        entitiesFind.restore();
        entityFind.restore();

        assert.instanceOf(attribute1, EntityCollection);
        assert.lengthOf(attribute1, 0);
    });

    it("on new entities, no find calls should be made", async () => {
        const mainEntity = new MainEntity();

        const entitiesFind = sandbox.spy(mainEntity.getDriver(), "find");
        assert.instanceOf(
            mainEntity.getAttribute("attribute1").value.getCurrent(),
            EntityCollection
        );
        assert.lengthOf(mainEntity.getAttribute("attribute1").value.getCurrent(), 0);

        mainEntity.attribute1;
        mainEntity.attribute1;
        await mainEntity.attribute1;
        await mainEntity.attribute1;
        assert.equal(entitiesFind.callCount, 0);

        const attribute1 = await mainEntity.attribute1;
        assert.equal(entitiesFind.callCount, 0);

        entitiesFind.restore();

        assert.instanceOf(attribute1, EntityCollection);
        assert.lengthOf(attribute1, 0);
    });

    it("should throw an exception", async () => {
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

        assert.instanceOf(error, Error);
        entityPopulate.restore();
    });

    it("setUsing method must set all passed parameters correctly", async () => {
        const entity = new MainEntity();
        entity
            .attr("entitiesUsing")
            .entities(Entity1)
            .setUsing(Entity2, "customAttribute");

        assert.deepEqual(entity.getAttribute("entitiesUsing").classes, {
            entities: {
                attribute: "mainEntity",
                class: Entity1,
                id: null
            },
            parent: "MainEntity",
            using: {
                attribute: "customAttribute",
                class: Entity2
            }
        });
    });

    it("getJSONValue must return assigned value if not EntityCollection", async () => {
        const entity = new MainEntity();
        entity.attribute1 = 123;

        const jsonValue = await entity.getAttribute("attribute1").getJSONValue();
        assert.equal(jsonValue, 123);
    });
});
