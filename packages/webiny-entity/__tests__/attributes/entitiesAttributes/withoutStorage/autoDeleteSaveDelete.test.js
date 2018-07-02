import { QueryResult } from "webiny-entity/index";
import { MainEntity, Entity1 } from "../../../entities/entitiesAttributeEntities";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("save and delete entities attribute test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("should recursively trigger validation and save all entities if data is valid", async () => {
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
                    { id: null, name: "ee", type: "dog", markedAsCannotDelete: true },
                    { id: null, name: "ff", type: "dog", markedAsCannotDelete: true },
                    { id: null, name: "gg", type: "invalid", markedAsCannotDelete: false }
                ]
            },
            {
                id: null,
                firstName: "Jane",
                lastName: "Doe",
                markedAsCannotDelete: true,
                entity1Entities: [
                    { id: null, name: "ii", type: "invalid", markedAsCannotDelete: true }
                ]
            }
        ];

        let error = null;
        try {
            await mainEntity.save();
        } catch (e) {
            error = e;
        }

        expect(error.data.invalidAttributes.attribute1.code).toEqual("INVALID_ATTRIBUTE");
        expect(error.data.invalidAttributes.attribute1.data.length).toBe(2);

        let items = error.data.invalidAttributes.attribute1.data;
        expect(items[0].data.index).toEqual(0);
        expect(items[0].data.invalidAttributes.type.data.validator).toEqual("in");

        expect(items[1].data.index).toEqual(1);
        expect(items[1].data.invalidAttributes.type.data.validator).toEqual("in");

        await mainEntity.set("attribute1.0.type", "dog");
        await mainEntity.set("attribute1.1.type", "dog");

        error = null;
        try {
            await mainEntity.save();
        } catch (e) {
            error = e;
        }

        expect(error.data.invalidAttributes.attribute2.code).toEqual("INVALID_ATTRIBUTE");
        expect(error.data.invalidAttributes.attribute2.data.length).toBe(2);

        items = error.data.invalidAttributes.attribute2.data;
        expect(items[0].data.index).toEqual(0);
        expect(items[0].data.invalidAttributes.entity1Entities.data.length).toBe(1);
        expect(items[0].data.invalidAttributes.entity1Entities.data[0]).toEqual({
            code: "INVALID_ATTRIBUTES",
            data: {
                index: 2,
                invalidAttributes: {
                    type: {
                        code: "INVALID_ATTRIBUTE",
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

        expect(items[1].data.index).toEqual(1);
        expect(items[1].data.invalidAttributes.entity1Entities.data.length).toBe(1);
        expect(items[1].data.invalidAttributes.entity1Entities.data[0]).toEqual({
            code: "INVALID_ATTRIBUTES",
            data: {
                index: 0,
                invalidAttributes: {
                    type: {
                        code: "INVALID_ATTRIBUTE",
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

        expect(error.data.invalidAttributes.attribute2.code).toEqual("INVALID_ATTRIBUTE");
        expect(error.data.invalidAttributes.attribute2.data.length).toBe(1);

        items = error.data.invalidAttributes.attribute2.data;
        expect(items[0].data.index).toEqual(0);
        expect(items[0].data.invalidAttributes.entity1Entities.data.length).toBe(1);
        expect(items[0].data.invalidAttributes.entity1Entities.data[0]).toEqual({
            code: "INVALID_ATTRIBUTES",
            data: {
                index: 2,
                invalidAttributes: {
                    type: {
                        code: "INVALID_ATTRIBUTE",
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

        let entitySave = sandbox
            .stub(mainEntity.getDriver(), "save")
            .onCall(1)
            .callsFake(entity => {
                entity.id = "BB";
                return new QueryResult();
            })
            .onCall(2)
            .callsFake(entity => {
                entity.id = "CC";
                return new QueryResult();
            })
            .onCall(3)
            .callsFake(entity => {
                entity.id = "DD";
                return new QueryResult();
            })
            .onCall(4)
            .callsFake(entity => {
                entity.id = "EE";
                return new QueryResult();
            })
            .onCall(5)
            .callsFake(entity => {
                entity.id = "FF";
                return new QueryResult();
            })
            .onCall(6)
            .callsFake(entity => {
                entity.id = "GG";
                return new QueryResult();
            })
            .onCall(7)
            .callsFake(entity => {
                entity.id = "HH";
                return new QueryResult();
            })
            .onCall(8)
            .callsFake(entity => {
                entity.id = "II";
                return new QueryResult();
            })
            .onCall(0)
            .callsFake(entity => {
                entity.id = "AA";
                return new QueryResult();
            });

        await mainEntity.save();

        expect(entitySave.callCount).toEqual(9);

        expect(await mainEntity.get("id")).toEqual("AA");
        expect(await mainEntity.get("attribute1.0.id")).toEqual("BB");
        expect(await mainEntity.get("attribute1.1.id")).toEqual("CC");
        expect(await mainEntity.get("attribute2.0.entity1Entities.0.id")).toEqual("EE");
        expect(await mainEntity.get("attribute2.0.entity1Entities.1.id")).toEqual("FF");
        expect(await mainEntity.get("attribute2.0.entity1Entities.2.id")).toEqual("GG");
        expect(await mainEntity.get("attribute2.0.id")).toEqual("DD");
        expect(await mainEntity.get("attribute2.1.entity1Entities.0.id")).toEqual("II");
        expect(await mainEntity.get("attribute2.1.id")).toEqual("HH");

        entitySave.restore();
    });

    test("should save only attributes that were loaded", async () => {
        const mainEntity = new MainEntity();
        mainEntity.attribute1 = [
            { id: null, name: "Enlai", type: "dog", markedAsCannotDelete: false },
            new Entity1().populate({ id: null, name: "Bucky", type: "dog" })
        ];

        let entitySave = sandbox
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

        let entityFind = sandbox.stub(mainEntity.getDriver(), "find");

        await mainEntity.save();

        expect(entitySave.callCount).toEqual(3);
        expect(entityFind.callCount).toEqual(0);

        entitySave.restore();
        entityFind.restore();
    });

    test("auto delete must be automatically enabled and deletion must stop deletion if error was thrown", async () => {
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

        let entitySave = sandbox
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

        expect(entitySave.callCount).toEqual(9);
        entitySave.restore();

        let entityDelete = sandbox.stub(mainEntity.getDriver(), "delete");
        let error = null;
        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Entity1 entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await mainEntity.set("attribute1.0.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Entity1 entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await mainEntity.set("attribute2.0.entity1Entities.0.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Entity1 entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await mainEntity.set("attribute2.0.entity1Entities.1.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Entity2 entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await mainEntity.set("attribute2.0.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Entity1 entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await mainEntity.set("attribute2.1.entity1Entities.0.markedAsCannotDelete", false);

        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Entity2 entity");
        expect(entityDelete.notCalled).toBeTruthy();

        await mainEntity.set("attribute2.1.markedAsCannotDelete", false);

        await mainEntity.delete();
        expect(entityDelete.callCount).toEqual(9);
        entityDelete.restore();
    });

    test("should properly delete linked entities even though they are not loaded", async () => {
        let entityFindById = sandbox.stub(MainEntity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: "A" });
        });
        const mainEntity = await MainEntity.findById(123);
        entityFindById.restore();

        let entityFind = sandbox
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

        let entityDelete = sandbox
            .stub(MainEntity.getDriver(), "delete")
            .callsFake(() => new QueryResult());

        let error = null;
        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loaded: true,
            loading: false
        });
        expect(mainEntity.getAttribute("attribute1").value.current[0].id).toEqual("B");
        expect(mainEntity.getAttribute("attribute1").value.current[1].id).toEqual("C");
        expect(mainEntity.getAttribute("attribute2").value.state).toEqual({
            loaded: false,
            loading: false
        });
        expect(mainEntity.getAttribute("attribute2").value.current.length).toBe(0);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Entity1 entity");
        expect(entityDelete.notCalled).toBeTruthy();

        expect(entityFind.callCount).toEqual(1);
        expect(entityDelete.callCount).toEqual(0);

        await mainEntity.set("attribute1.0.markedAsCannotDelete", false);

        error = null;
        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loaded: true,
            loading: false
        });
        expect(mainEntity.getAttribute("attribute1").value.current[0].id).toEqual("B");
        expect(mainEntity.getAttribute("attribute1").value.current[1].id).toEqual("C");
        expect(mainEntity.getAttribute("attribute2").value.state).toEqual({
            loaded: true,
            loading: false
        });
        expect(mainEntity.getAttribute("attribute2").value.current[0].id).toEqual("D");
        expect(mainEntity.getAttribute("attribute2").value.current[1].id).toEqual("E");

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual("Cannot delete Entity2 entity");
        expect(entityDelete.notCalled).toBeTruthy();

        expect(entityFind.callCount).toEqual(3);
        expect(entityDelete.callCount).toEqual(0);

        await mainEntity.set("attribute2.0.markedAsCannotDelete", false);

        error = null;
        try {
            await mainEntity.delete();
        } catch (e) {
            error = e;
        }

        expect(error).toBeNull();

        expect(entityFind.callCount).toEqual(4);
        expect(entityDelete.callCount).toEqual(9);

        entityFind.restore();
        entityDelete.restore();
    });
});
