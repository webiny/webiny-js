import { QueryResult, EntityCollection } from "../../../src/index";
import { ModelError } from "webiny-model";
import {
    MainEntity,
    Entity1,
    Entity2,
    MainSetOnceEntity
} from "../../entities/entitiesAttributeEntities";
import { assert, expect } from "chai";
import sinon from "sinon";
import { One } from "../../entities/oneTwoThree";

describe("attribute entities test", function() {
    const entity = new MainEntity();

    it("should fail - attributes should accept array of entities", async () => {
        entity.attribute1 = new Entity1();
        assert.instanceOf(await entity.attribute1, EntityCollection);

        entity.attribute2 = new Entity1();
        assert.instanceOf(await entity.attribute2, EntityCollection);
    });

    it("should pass - empty arrays set", async () => {
        entity.attribute1 = [];
        entity.attribute2 = [];
        await entity.validate();
    });

    it("should fail - arrays with empty plain objects set - nested validation must be triggered", async () => {
        entity.attribute1 = [{}, {}];
        entity.attribute2 = [{}, {}, {}];
        try {
            await entity.validate();
        } catch (e) {
            const attr1 = e.data.invalidAttributes.attribute1;
            assert.lengthOf(attr1.data.items, 2);
            assert.equal(attr1.data.items[0].data.index, 0);
            assert.equal(
                attr1.data.items[0].data.invalidAttributes.name.type,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.equal(
                attr1.data.items[0].data.invalidAttributes.name.data.validator,
                "required"
            );
            assert.notExists(attr1.data.items[0].data.invalidAttributes.type);

            const attr2 = e.data.invalidAttributes.attribute2;
            assert.lengthOf(attr2.data.items, 3);
            assert.equal(attr2.data.items[0].data.index, 0);
            assert.equal(attr2.data.items[1].data.index, 1);
            assert.equal(attr2.data.items[2].data.index, 2);

            assert.equal(
                attr2.data.items[0].data.invalidAttributes.firstName.type,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.equal(
                attr2.data.items[0].data.invalidAttributes.lastName.type,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.notExists(attr2.data.items[0].data.invalidAttributes.enabled);

            return;
        }
        throw Error("Error should've been thrown.");
    });

    it("should pass - valid data sent", async () => {
        entity.attribute1 = [
            { name: "Enlai", type: "dog" },
            { name: "Rocky", type: "dog" },
            { name: "Lina", type: "parrot" }
        ];
        entity.attribute2 = [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Jane", lastName: "Doe" }
        ];
        await entity.validate();
    });

    it("should fail - all good except last item of attribute1", async () => {
        entity.attribute1 = [
            { name: "Enlai", type: "dog" },
            { name: "Rocky", type: "dog" },
            { name: "Lina", type: "bird" }
        ];
        entity.attribute2 = [
            { firstName: "John", lastName: "Doe" },
            { firstName: "Jane", lastName: "Doe" }
        ];

        try {
            await entity.validate();
        } catch (e) {
            const attr1 = e.data.invalidAttributes.attribute1;
            assert.lengthOf(attr1.data.items, 1);
            assert.equal(attr1.data.items[0].data.index, 2);
            assert.equal(
                attr1.data.items[0].data.invalidAttributes.type.type,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.equal(attr1.data.items[0].data.invalidAttributes.type.data.validator, "in");
        }
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

    it("should correctly validate instances in the attribute and throw errors appropriately", async () => {
        const mainEntity = new MainEntity();

        let error = null;
        try {
            await mainEntity.set("attribute1", [
                null,
                10,
                { id: "A", name: "Enlai", type: "dog" },
                new Entity2().populate({
                    firstName: "Foo",
                    lastName: "bar"
                })
            ]);
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);

        mainEntity.attribute2 = [{ id: "B", firstName: "John", lastName: "Doe" }];

        sinon
            .stub(entity.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return { id: 10, name: "Bucky", type: "dog" };
            })
            .onCall(1)
            .callsFake(() => {
                return { id: "AA", firstName: "Foo", lastName: "Bar" };
            });

        await mainEntity.getAttribute("attribute1").validate();
        await mainEntity.getAttribute("attribute2").validate();

        entity.getDriver().findById.restore();

        mainEntity.attribute1 = null;
        await mainEntity.getAttribute("attribute1").validate();
    });

    it("should accept null value", async () => {});

    it("should lazy load any of the accessed linked entities", async () => {
        const entityFind = sinon
            .stub(MainEntity.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: 10 });
            });

        const mainEntity = await MainEntity.findById(123);
        entityFind.restore();

        const entitiesFind = sinon
            .stub(entity.getDriver(), "find")
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
        const entityFind = sinon
            .stub(MainEntity.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: 10 });
            });

        const mainEntity = await MainEntity.findById(123);
        entityFind.restore();

        const entitiesFind = sinon.spy(entity.getDriver(), "find");

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

        const entitiesFind = sinon.spy(entity.getDriver(), "find");
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

        const entityPopulate = sinon
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
});
