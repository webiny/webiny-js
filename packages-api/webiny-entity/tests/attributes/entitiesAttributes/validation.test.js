import { QueryResult, EntityCollection } from "../../../src/index";
import { ModelError } from "webiny-model";
import { MainEntity, Entity1, Entity2 } from "../../entities/entitiesAttributeEntities";
import sinon from "sinon";

import { assert } from "chai";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
chai.should();

const sandbox = sinon.sandbox.create();

describe("attribute entities test", function() {
    afterEach(() => sandbox.restore());

    const entity = new MainEntity();

    it("should set empty EntityCollection - attributes should accept array of entities", async () => {
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

        sandbox
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

    it("should validate if attribute is being loaded", async () => {
        let findById = sandbox
            .stub(MainEntity.getDriver(), "findById")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "mainEntity", name: "MainEntity" });
            });

        let find = sandbox
            .stub(MainEntity.getDriver(), "find")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "mainEntity", name: "MainEntity" });
            });

        const mainEntity = await MainEntity.findById("mainEntity");

        await mainEntity.save();
        assert.deepEqual(mainEntity.getAttribute("attribute1").value.status, {
            loaded: false,
            loading: false
        });
        assert.equal(findById.callCount, 1);
        findById.restore();

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.status, {
            loaded: false,
            loading: false
        });
        mainEntity.attribute1 = [{ type: "test" }];

        mainEntity.save().should.be.rejectedWith(ModelError);
    });
});
