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
        assert.instanceOf(await entity.attribute1, Entity1);

        entity.attribute2 = new Entity1();
        assert.instanceOf(await entity.attribute2, Entity1);
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
                attr1.data.items[0].data.invalidAttributes.name.code,
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
                attr2.data.items[0].data.invalidAttributes.firstName.code,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.equal(
                attr2.data.items[0].data.invalidAttributes.lastName.code,
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
                attr1.data.items[0].data.invalidAttributes.type.code,
                ModelError.INVALID_ATTRIBUTE
            );
            assert.equal(attr1.data.items[0].data.invalidAttributes.type.data.validator, "in");
        }
    });

    it("should correctly validate instances in the attribute and throw errors appropriately", async () => {
        const mainEntity = new MainEntity();

        mainEntity.attribute1 = [
            null,
            10,
            "A",
            { id: "B", name: "Enlai", type: "dog" },
            new Entity2().populate({
                firstName: "Foo",
                lastName: "bar"
            })
        ];

        mainEntity.attribute2 = [{ id: "C", firstName: "John", lastName: "Doe" }];

        sandbox
            .stub(entity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "A", name: "Bucky", type: "dog" });
            })
            .callsFake(() => {
                return new QueryResult({ id: "B", name: "Enlai", type: "dog" });
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult({ id: "C", firstName: "Foo", lastName: "Bar" });
            });

        let error = null;
        try {
            await mainEntity.getAttribute("attribute1").validate();
        } catch (e) {
            error = e;
        }

        assert.deepEqual(error.data, {
            items: [
                {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        index: 0
                    },
                    message:
                        "Validation failed, item at index 0 not an instance of correct Entity class."
                },
                {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        index: 1
                    },
                    message:
                        "Validation failed, item at index 1 not an instance of correct Entity class."
                },
                {
                    code: "INVALID_ATTRIBUTE",
                    data: {
                        index: 4
                    },
                    message:
                        "Validation failed, item at index 4 not an instance of correct Entity class."
                }
            ]
        });

        await mainEntity.getAttribute("attribute2").validate();

        mainEntity.attribute1 = null;
        await mainEntity.getAttribute("attribute1").validate();
    });

    it("should validate if attribute is being loaded", async () => {
        let findById = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "mainEntity", name: "MainEntity" });
            });

        sandbox
            .stub(MainEntity.getDriver(), "find")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "mainEntity", name: "MainEntity" });
            });

        const mainEntity = await MainEntity.findById("mainEntity");

        await mainEntity.save();
        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loaded: false,
            loading: false
        });
        assert.equal(findById.callCount, 1);
        findById.restore();

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.state, {
            loaded: false,
            loading: false
        });
        mainEntity.attribute1 = [{ type: "test" }];

        mainEntity.save().should.be.rejectedWith(ModelError);
    });

    it("should validate on attribute level and recursively on entity level", async () => {
        let findById = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult({ id: "mainEntity", name: "MainEntity" });
            });

        const mainEntity = await MainEntity.findById("mainEntity");
        findById.restore();

        mainEntity
            .attr("requiredEntity")
            .entities(Entity1)
            .setValidators("required,minLength:2");

        let error = null;
        try {
            await mainEntity.validate();
        } catch (e) {
            error = e;
        }

        assert.equal(error.data.invalidAttributes.requiredEntity.code, "INVALID_ATTRIBUTE");
        assert.equal(error.data.invalidAttributes.requiredEntity.data.validator, "required");

        mainEntity.requiredEntity = [{ name: "requiredEntity" }];

        error = null;
        try {
            await mainEntity.validate();
        } catch (e) {
            error = e;
        }

        assert.equal(error.data.invalidAttributes.requiredEntity.code, "INVALID_ATTRIBUTE");
        assert.equal(error.data.invalidAttributes.requiredEntity.data.validator, "minLength");
    });

    it("if an instance of another Entity class was assigned in EntityCollection, validation must fail", async () => {
        const entity = new MainEntity();
        entity.attribute1 = new EntityCollection([new Entity1(), new Entity2()]);

        try {
            await entity.validate();
        } catch (e) {
            assert.deepEqual(e.data, {
                invalidAttributes: {
                    attribute1: {
                        code: "INVALID_ATTRIBUTE",
                        data: {
                            items: [
                                {
                                    code: "INVALID_ATTRIBUTES",
                                    data: {
                                        index: 0,
                                        invalidAttributes: {
                                            name: {
                                                code: "INVALID_ATTRIBUTE",
                                                data: {
                                                    message: "Value is required.",
                                                    value: null,
                                                    validator: "required"
                                                },
                                                message: "Invalid attribute."
                                            }
                                        }
                                    },
                                    message: "Validation failed."
                                },
                                {
                                    code: "INVALID_ATTRIBUTE",
                                    data: {
                                        index: 1
                                    },
                                    message:
                                        "Validation failed, item at index 1 not an instance of correct Entity class."
                                }
                            ]
                        },
                        message: "Validation failed."
                    }
                }
            });
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    it("should fail validating if not an EntityCollection is assigned as value", async () => {
        const entity = new MainEntity();
        entity.attribute1 = 123;

        try {
            await entity.validate();
        } catch (e) {
            assert.deepEqual(e.data.invalidAttributes, {
                attribute1: {
                    code: "INVALID_ATTRIBUTE",
                    data: {},
                    message:
                        "Validation failed, received number, expecting instance of Array or EntityCollection."
                }
            });
            return;
        }

        throw Error(`Error should've been thrown.`);
    });
});
