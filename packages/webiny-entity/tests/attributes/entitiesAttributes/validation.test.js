import { QueryResult, EntityCollection } from "../../../src/index";
import { ModelError } from "webiny-model";
import { MainEntity, Entity1, Entity2 } from "../../entities/entitiesAttributeEntities";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("attribute entities test", () => {
    afterEach(() => sandbox.restore());

    const entity = new MainEntity();

    test("should set empty EntityCollection - attributes should accept array of entities", async () => {
        entity.attribute1 = new Entity1();
        expect(await entity.attribute1).toBeInstanceOf(Entity1);

        entity.attribute2 = new Entity1();
        expect(await entity.attribute2).toBeInstanceOf(Entity1);
    });

    test("should pass - empty arrays set", async () => {
        entity.attribute1 = [];
        entity.attribute2 = [];
        await entity.validate();
    });

    test("should fail - arrays with empty plain objects set - nested validation must be triggered", async () => {
        entity.attribute1 = [{}, {}];
        entity.attribute2 = [{}, {}, {}];
        try {
            await entity.validate();
        } catch (e) {
            const attr1 = e.data.invalidAttributes.attribute1;
            expect(attr1.data.length).toBe(2);
            expect(attr1.data[0].data.index).toEqual(0);
            expect(attr1.data[0].data.invalidAttributes.name.code).toEqual(
                ModelError.INVALID_ATTRIBUTE
            );
            expect(attr1.data[0].data.invalidAttributes.name.data.validator).toEqual("required");
            expect(attr1.data[0].data.invalidAttributes.type).toBeUndefined();

            const attr2 = e.data.invalidAttributes.attribute2;
            expect(attr2.data.length).toBe(3);
            expect(attr2.data[0].data.index).toEqual(0);
            expect(attr2.data[1].data.index).toEqual(1);
            expect(attr2.data[2].data.index).toEqual(2);

            expect(attr2.data[0].data.invalidAttributes.firstName.code).toEqual(
                ModelError.INVALID_ATTRIBUTE
            );
            expect(attr2.data[0].data.invalidAttributes.lastName.code).toEqual(
                ModelError.INVALID_ATTRIBUTE
            );
            expect(attr2.data[0].data.invalidAttributes.enabled).toBeUndefined();

            return;
        }
        throw Error("Error should've been thrown.");
    });

    test("should pass - valid data sent", async () => {
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

    test("should fail - all good except last item of attribute1", async () => {
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
            expect(attr1.data.length).toBe(1);
            expect(attr1.data[0].data.index).toEqual(2);
            expect(attr1.data[0].data.invalidAttributes.type.code).toEqual(
                ModelError.INVALID_ATTRIBUTE
            );
            expect(attr1.data[0].data.invalidAttributes.type.data.validator).toEqual("in");
        }
    });

    test("should correctly validate instances in the attribute and throw errors appropriately", async () => {
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

        expect(error.data).toEqual([
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
        ]);

        await mainEntity.getAttribute("attribute2").validate();

        mainEntity.attribute1 = null;
        await mainEntity.getAttribute("attribute1").validate();
    });

    test("should validate if attribute is being loaded", async () => {
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
        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loaded: false,
            loading: false
        });
        expect(findById.callCount).toEqual(1);
        findById.restore();

        expect(mainEntity.getAttribute("attribute1").value.state).toEqual({
            loaded: false,
            loading: false
        });
        mainEntity.attribute1 = [{ type: "test" }];

        await expect(mainEntity.save()).rejects.toThrow(ModelError);
    });

    test("should validate on attribute level and recursively on entity level", async () => {
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

        expect(error.data.invalidAttributes.requiredEntity.code).toEqual("INVALID_ATTRIBUTE");
        expect(error.data.invalidAttributes.requiredEntity.data.validator).toEqual("required");

        mainEntity.requiredEntity = [{ name: "requiredEntity" }];

        error = null;
        try {
            await mainEntity.validate();
        } catch (e) {
            error = e;
        }

        expect(error.data.invalidAttributes.requiredEntity.code).toEqual("INVALID_ATTRIBUTE");
        expect(error.data.invalidAttributes.requiredEntity.data.validator).toEqual("minLength");
    });

    test("if an instance of another Entity class was assigned in EntityCollection, validation must fail", async () => {
        const entity = new MainEntity();
        entity.attribute1 = new EntityCollection([new Entity1(), new Entity2()]);

        try {
            await entity.validate();
        } catch (e) {
            expect(e.data).toEqual({
                invalidAttributes: {
                    attribute1: {
                        code: "INVALID_ATTRIBUTE",
                        data: [
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
                        ],
                        message: "Validation failed."
                    }
                }
            });
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    test("should fail validating if not an EntityCollection is assigned as value", async () => {
        const entity = new MainEntity();
        entity.attribute1 = 123;

        try {
            await entity.validate();
        } catch (e) {
            expect(e.data.invalidAttributes).toEqual({
                attribute1: {
                    code: "INVALID_ATTRIBUTE",
                    data: null,
                    message:
                        "Validation failed, received number, expecting instance of Array or EntityCollection."
                }
            });
            return;
        }

        throw Error(`Error should've been thrown.`);
    });
});
