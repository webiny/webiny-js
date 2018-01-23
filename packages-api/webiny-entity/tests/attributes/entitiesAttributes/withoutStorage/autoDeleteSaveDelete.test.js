import { QueryResult } from "../../../../src/index";
import { MainEntity, Entity1 } from "../../../entities/entitiesAttributeEntities";
import { assert } from "chai";
import sinon from "sinon";

describe("save and delete entities attribute test", () => {
    it("should recursively trigger validation and save all entities if data is valid", async () => {
        const mainEntity = new MainEntity();
        mainEntity.attribute1 = [
            { id: null, name: "Enlai", type: "invalid", markedAsCannotDelete: true },
            new Entity1().populate({ id: null, name: "Bucky", type: "invalid" })
        ];

        mainEntity.attribute2 = [
            {
                id: null,
                firstName: "John",
                lastName: "Doe",
                markedAsCannotDelete: true,
                entity1Entities: [
                    { id: null, name: "dd", type: "dog", markedAsCannotDelete: true },
                    { id: null, name: "ee", type: "dog", markedAsCannotDelete: true },
                    { id: null, name: "ff", type: "invalid", markedAsCannotDelete: false }
                ]
            },
            {
                id: null,
                firstName: "Jane",
                lastName: "Doe",
                markedAsCannotDelete: true,
                entity1Entities: [
                    { id: null, name: "gg", type: "invalid", markedAsCannotDelete: true }
                ]
            }
        ];

        let error = null;
        try {
            await mainEntity.save();
        } catch (e) {
            error = e;
        }

        assert.equal(error.data.invalidAttributes.attribute1.type, "invalidAttribute");
        assert.lengthOf(error.data.invalidAttributes.attribute1.data.items, 2);

        let items = error.data.invalidAttributes.attribute1.data.items;
        assert.equal(items[0].data.index, 0);
        assert.equal(items[0].data.invalidAttributes.type.data.validator, "in");

        assert.equal(items[1].data.index, 1);
        assert.equal(items[1].data.invalidAttributes.type.data.validator, "in");

        await mainEntity.set("attribute1.0.type", "dog");
        await mainEntity.set("attribute1.1.type", "dog");

        error = null;
        try {
            await mainEntity.save();
        } catch (e) {
            error = e;
        }

        assert.equal(error.data.invalidAttributes.attribute2.type, "invalidAttribute");
        assert.lengthOf(error.data.invalidAttributes.attribute2.data.items, 2);

        items = error.data.invalidAttributes.attribute2.data.items;
        assert.equal(items[0].data.index, 0);
        assert.lengthOf(items[0].data.invalidAttributes.entity1Entities.data.items, 1);
        assert.deepEqual(
            items[0].data.invalidAttributes.entity1Entities.data.items[0],

            {
                type: "invalidAttributes",
                data: {
                    index: 2,
                    invalidAttributes: {
                        type: {
                            type: "invalidAttribute",
                            data: {
                                message:
                                    "Value must be one of the following: cat, dog, mouse, parrot.",
                                value: "invalid",
                                validator: "in"
                            },
                            message: "Invalid attribute."
                        }
                    }
                },
                message: "Validation failed."
            }
        );

        assert.equal(items[1].data.index, 1);
        assert.lengthOf(items[1].data.invalidAttributes.entity1Entities.data.items, 1);
        assert.deepEqual(items[1].data.invalidAttributes.entity1Entities.data.items[0], {
            type: "invalidAttributes",
            data: {
                index: 0,
                invalidAttributes: {
                    type: {
                        type: "invalidAttribute",
                        data: {
                            message: "Value must be one of the following: cat, dog, mouse, parrot.",
                            value: "invalid",
                            validator: "in"
                        },
                        message: "Invalid attribute."
                    }
                }
            },
            message: "Validation failed."
        });

        await mainEntity.set("attribute2.1.entity1Entities.0.type", "dog");

        error = null;
        try {
            await mainEntity.save();
        } catch (e) {
            error = e;
        }

        assert.equal(error.data.invalidAttributes.attribute2.type, "invalidAttribute");
        assert.lengthOf(error.data.invalidAttributes.attribute2.data.items, 1);

        items = error.data.invalidAttributes.attribute2.data.items;
        assert.equal(items[0].data.index, 0);
        assert.lengthOf(items[0].data.invalidAttributes.entity1Entities.data.items, 1);
        assert.deepEqual(items[0].data.invalidAttributes.entity1Entities.data.items[0], {
            type: "invalidAttributes",
            data: {
                index: 2,
                invalidAttributes: {
                    type: {
                        type: "invalidAttribute",
                        data: {
                            message: "Value must be one of the following: cat, dog, mouse, parrot.",
                            value: "invalid",
                            validator: "in"
                        },
                        message: "Invalid attribute."
                    }
                }
            },
            message: "Validation failed."
        });

        await mainEntity.set("attribute2.0.entity1Entities.2.type", "dog");

        let entitySave = sinon
            .stub(mainEntity.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "BB";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "CC";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "DD";
                return new QueryResult();
            })
            .onCall(3)
            .callsFake(entity => {
                entity.id = "EE";
                return new QueryResult();
            })
            .onCall(4)
            .callsFake(entity => {
                entity.id = "FF";
                return new QueryResult();
            })
            .onCall(5)
            .callsFake(entity => {
                entity.id = "GG";
                return new QueryResult();
            })
            .onCall(6)
            .callsFake(entity => {
                entity.id = "HH";
                return new QueryResult();
            })
            .onCall(7)
            .callsFake(entity => {
                entity.id = "II";
                return new QueryResult();
            })
            .onCall(8)
            .callsFake(entity => {
                entity.id = "AA";
                return new QueryResult();
            });

        await mainEntity.save();

        assert.equal(entitySave.callCount, 9);

        assert.equal(await mainEntity.get("id"), "AA");
        assert.equal(await mainEntity.get("attribute1.0.id"), "BB");
        assert.equal(await mainEntity.get("attribute1.1.id"), "CC");
        assert.equal(await mainEntity.get("attribute2.0.entity1Entities.0.id"), "DD");
        assert.equal(await mainEntity.get("attribute2.0.entity1Entities.1.id"), "EE");
        assert.equal(await mainEntity.get("attribute2.0.entity1Entities.2.id"), "FF");
        assert.equal(await mainEntity.get("attribute2.0.id"), "GG");
        assert.equal(await mainEntity.get("attribute2.1.entity1Entities.0.id"), "HH");
        assert.equal(await mainEntity.get("attribute2.1.id"), "II");

        entitySave.restore();
    });

    it("should save only attributes that were loaded", async () => {
        const mainEntity = new MainEntity();
        mainEntity.attribute1 = [
            { id: null, name: "Enlai", type: "dog", markedAsCannotDelete: false },
            new Entity1().populate({ id: null, name: "Bucky", type: "dog" })
        ];

        let entitySave = sinon
            .stub(mainEntity.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "BB";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "CC";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "AA";
                return new QueryResult();
            });

        let entityFind = sinon.stub(mainEntity.getDriver(), "find");

        await mainEntity.save();

        assert.equal(entitySave.callCount, 3);
        assert.equal(entityFind.callCount, 0);

        entitySave.restore();
        entityFind.restore();
    });

    it("auto delete must be automatically enabled and deletion must stop deletion if error was thrown", async () => {
        const mainEntity = new MainEntity();
        mainEntity.attribute1 = [
            { id: null, name: "Enlai", type: "dog", markedAsCannotDelete: true },
            new Entity1().populate({ id: null, name: "Bucky", type: "parrot" })
        ];

        mainEntity.attribute2 = [
            {
                id: null,
                firstName: "John",
                lastName: "Doe",
                markedAsCannotDelete: true,
                entity1Entities: [
                    { id: null, name: "dd", type: "dog", markedAsCannotDelete: true },
                    { id: null, name: "ee", type: "dog", markedAsCannotDelete: true },
                    { id: null, name: "ff", type: "parrot", markedAsCannotDelete: false }
                ]
            },
            {
                id: null,
                firstName: "Jane",
                lastName: "Doe",
                markedAsCannotDelete: true,
                entity1Entities: [{ id: null, name: "gg", type: "dog", markedAsCannotDelete: true }]
            }
        ];

        let entitySave = sinon
            .stub(mainEntity.getDriver(), "save")
            .onCall(0)
            .callsFake(entity => {
                entity.id = "BB";
                return new QueryResult();
            })
            .onCall(1)
            .callsFake(entity => {
                entity.id = "CC";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "DD";
                return new QueryResult();
            })
            .onCall(3)
            .callsFake(entity => {
                entity.id = "EE";
                return new QueryResult();
            })
            .onCall(4)
            .callsFake(entity => {
                entity.id = "FF";
                return new QueryResult();
            })
            .onCall(5)
            .callsFake(entity => {
                entity.id = "GG";
                return new QueryResult();
            })
            .onCall(6)
            .callsFake(entity => {
                entity.id = "HH";
                return new QueryResult();
            })
            .onCall(7)
            .callsFake(entity => {
                entity.id = "II";
                return new QueryResult();
            })
            .onCall(8)
            .callsFake(entity => {
                entity.id = "AA";
                return new QueryResult();
            });

        await mainEntity.save();

        assert.equal(entitySave.callCount, 9);
        entitySave.restore();

        let entityDelete = sinon.stub(mainEntity.getDriver(), "delete");
        let error = null;
        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Entity1 entity");
        assert(entityDelete.notCalled);

        await mainEntity.set("attribute1.0.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Entity1 entity");
        assert(entityDelete.notCalled);

        await mainEntity.set("attribute2.0.entity1Entities.0.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Entity1 entity");
        assert(entityDelete.notCalled);

        await mainEntity.set("attribute2.0.entity1Entities.1.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Entity2 entity");
        assert(entityDelete.notCalled);

        await mainEntity.set("attribute2.0.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Entity1 entity");
        assert(entityDelete.notCalled);

        await mainEntity.set("attribute2.1.entity1Entities.0.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Entity2 entity");
        assert(entityDelete.notCalled);

        await mainEntity.set("attribute2.1.markedAsCannotDelete", false);

        await mainEntity.delete();
        assert.equal(entityDelete.callCount, 9);
        entityDelete.restore();
    });

    it("should properly delete linked entity even though they are not loaded", async () => {
        let entityFindById = sinon.stub(MainEntity.getDriver(), "findById").callsFake(() => {
            return new QueryResult({ id: "A" });
        });
        const mainEntity = await MainEntity.findById(123);
        entityFindById.restore();

        let entityFind = sinon
            .stub(MainEntity.getDriver(), "find")
            .onCall(0)
            .callsFake(() => {
                return new QueryResult([
                    { id: "B", name: "b", type: "dog", markedAsCannotDelete: true },
                    { id: "C", name: "c", type: "dog", markedAsCannotDelete: false }
                ]);
            })
            .onCall(1)
            .callsFake(() => {
                return new QueryResult([
                    {
                        id: "D",
                        firstName: "John",
                        lastName: "Doe",
                        markedAsCannotDelete: true
                    },
                    {
                        id: "E",
                        firstName: "Jane",
                        lastName: "Doe",
                        markedAsCannotDelete: false
                    }
                ]);
            })
            .onCall(2)
            .callsFake(() => {
                return new QueryResult([
                    { id: "F", name: "f", type: "dog", markedAsCannotDelete: false },
                    { id: "G", name: "g", type: "dog", markedAsCannotDelete: false },
                    { id: "H", name: "h", type: "parrot", markedAsCannotDelete: false }
                ]);
            })
            .onCall(3)
            .callsFake(() => {
                return new QueryResult([
                    { id: "I", name: "i", type: "dog", markedAsCannotDelete: false }
                ]);
            });

        let entityDelete = sinon
            .stub(MainEntity.getDriver(), "delete")
            .callsFake(() => new QueryResult());

        let error = null;
        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.status, {
            loaded: true,
            loading: false
        });
        assert.equal(mainEntity.getAttribute("attribute1").value.current[0].id, "B");
        assert.equal(mainEntity.getAttribute("attribute1").value.current[1].id, "C");
        assert.deepEqual(mainEntity.getAttribute("attribute2").value.status, {
            loaded: false,
            loading: false
        });
        assert.isEmpty(mainEntity.getAttribute("attribute2").value.current);

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Entity1 entity");
        assert(entityDelete.notCalled);

        assert.equal(entityFind.callCount, 1);
        assert.equal(entityDelete.callCount, 0);

        await mainEntity.set("attribute1.0.markedAsCannotDelete", false);

        error = null;
        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.deepEqual(mainEntity.getAttribute("attribute1").value.status, {
            loaded: true,
            loading: false
        });
        assert.equal(mainEntity.getAttribute("attribute1").value.current[0].id, "B");
        assert.equal(mainEntity.getAttribute("attribute1").value.current[1].id, "C");
        assert.deepEqual(mainEntity.getAttribute("attribute2").value.status, {
            loaded: true,
            loading: false
        });
        assert.equal(mainEntity.getAttribute("attribute2").value.current[0].id, "D");
        assert.equal(mainEntity.getAttribute("attribute2").value.current[1].id, "E");

        assert.instanceOf(error, Error);
        assert.equal(error.message, "Cannot delete Entity2 entity");
        assert(entityDelete.notCalled);

        assert.equal(entityFind.callCount, 3);
        assert.equal(entityDelete.callCount, 0);

        await mainEntity.set("attribute2.0.markedAsCannotDelete", false);

        error = null;
        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        assert.isNull(error);

        assert.equal(entityFind.callCount, 4);
        assert.equal(entityDelete.callCount, 9);

        entityFind.restore();
        entityDelete.restore();
    });

    it("should add an entity to the list of entities", async () => {});

    it("should delete entities that are not part of the array anymore", async () => {});

    // 2. autoDelete	da/ne
    // 3. using class	da/ne
});
