import {
    Main,
    MainMissingClassIdAttribute,
    MainMissingClassIdAttributeOption,
    A,
    B,
    C,
    InvalidEntityClass
} from "../../entities/multipleClassesEntities";
import sinon from "sinon";
import { ModelError } from "@webiny/model";

const sandbox = sinon.sandbox.create();

describe("multiple Entity classes test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => Main.getEntityPool().flush());

    test("should assign different Entity class instances and assign the classId to specified attribute", async () => {
        const main = new Main();

        await main.set("assignedTo", new A().populate({ name: "a" }));
        expect(main.assignedToClassId).toEqual("A");
        expect(await main.get("assignedTo.name")).toEqual("a");

        await main.set("assignedTo", new B().populate({ name: "b" }));
        expect(main.assignedToClassId).toEqual("B");
        expect(await main.get("assignedTo.name")).toEqual("b");

        await main.set("assignedTo", new C().populate({ name: "c" }));
        expect(main.assignedToClassId).toEqual("C");
        expect(await main.get("assignedTo.name")).toEqual("c");
    });

    test("must throw an error on validation because an invalid class was passed", async () => {
        const main = new Main();

        await main.set("assignedTo", new InvalidEntityClass());
        expect(main.assignedToClassId).toEqual("InvalidEntityClass");

        try {
            await main.validate();
        } catch (e) {
            expect(e).toBeInstanceOf(ModelError);
            expect(e.code).toEqual(ModelError.INVALID_ATTRIBUTES);
            expect(e.data).toEqual({
                invalidAttributes: {
                    assignedTo: {
                        code: "INVALID_ATTRIBUTE",
                        data: null,
                        message:
                            'Entity attribute "assignedTo" accepts multiple Entity classes but it was not found (classId attribute holds value "InvalidEntityClass").'
                    }
                }
            });
            return;
        }
        throw Error(`Error should've been thrown.`);
    });

    test("must throw an error since 'classIdAttribute' option is missing", async () => {
        const main = new MainMissingClassIdAttributeOption();
        await main.set("assignedTo", new A().populate({ name: "a" }));

        try {
            await main.validate();
        } catch (e) {
            expect(e).toBeInstanceOf(ModelError);
            expect(e.code).toEqual(ModelError.INVALID_ATTRIBUTES);
            expect(e.data).toEqual({
                invalidAttributes: {
                    assignedTo: {
                        code: "INVALID_ATTRIBUTE",
                        data: null,
                        message:
                            'Entity attribute "assignedTo" accepts multiple Entity classes but does not have "classIdAttribute" option defined.'
                    }
                }
            });
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    test("must throw an error since classId attribute is missing", async () => {
        const main = new MainMissingClassIdAttribute();
        await main.set("assignedTo", new A().populate({ name: "a" }));

        try {
            await main.validate();
        } catch (e) {
            expect(e).toBeInstanceOf(ModelError);
            expect(e.code).toEqual(ModelError.INVALID_ATTRIBUTES);
            expect(e.data).toEqual({
                invalidAttributes: {
                    assignedTo: {
                        code: "INVALID_ATTRIBUTE",
                        data: null,
                        message:
                            'Entity attribute "assignedTo" accepts multiple Entity classes but classId attribute is missing.'
                    }
                }
            });
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    test("must be able to set null as value", async () => {
        const main = new Main();
        main.assignedTo = new A().populate({ name: "a" });
        expect(main.assignedToClassId).toEqual("A");
        expect(await main.get("assignedTo.name")).toEqual("a");

        main.assignedTo = null;
        expect(main.assignedToClassId).toEqual(null);
        expect(await main.assignedTo).toBeNull();

        // Should not throw error.
        await main.validate();
    });
});
