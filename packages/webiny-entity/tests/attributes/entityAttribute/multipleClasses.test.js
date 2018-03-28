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
import { assert } from "chai";
import { ModelError } from "webiny-model";

const sandbox = sinon.sandbox.create();

describe("multiple Entity classes test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => Main.getEntityPool().flush());

    it("should assign different Entity class instances and assign the classId to specified attribute", async () => {
        const main = new Main();

        await main.set("assignedTo", new A().populate({ name: "a" }));
        assert.equal(main.assignedToClassId, "A");
        assert.equal(await main.get("assignedTo.name"), "a");

        await main.set("assignedTo", new B().populate({ name: "b" }));
        assert.equal(main.assignedToClassId, "B");
        assert.equal(await main.get("assignedTo.name"), "b");

        await main.set("assignedTo", new C().populate({ name: "c" }));
        assert.equal(main.assignedToClassId, "C");
        assert.equal(await main.get("assignedTo.name"), "c");
    });

    it("must throw an error on validation because an invalid class was passed", async () => {
        const main = new Main();

        await main.set("assignedTo", new InvalidEntityClass());
        assert.equal(main.assignedToClassId, "InvalidEntityClass");

        try {
            await main.validate();
        } catch (e) {
            assert.instanceOf(e, ModelError);
            assert.equal(e.code, ModelError.INVALID_ATTRIBUTES);
            assert.deepEqual(e.data, {
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

    it("must throw an error since 'classIdAttribute' option is missing", async () => {
        const main = new MainMissingClassIdAttributeOption();
        await main.set("assignedTo", new A().populate({ name: "a" }));

        try {
            await main.validate();
        } catch (e) {
            assert.instanceOf(e, ModelError);
            assert.equal(e.code, ModelError.INVALID_ATTRIBUTES);
            assert.deepEqual(e.data, {
                invalidAttributes: {
                    assignedTo: {
                        code: "INVALID_ATTRIBUTE",
                        data: {},
                        message:
                            'Entity attribute "assignedTo" accepts multiple Entity classes but does not have "classIdAttribute" option defined.'
                    }
                }
            });
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    it("must throw an error since classId attribute is missing", async () => {
        const main = new MainMissingClassIdAttribute();
        await main.set("assignedTo", new A().populate({ name: "a" }));

        try {
            await main.validate();
        } catch (e) {
            assert.instanceOf(e, ModelError);
            assert.equal(e.code, ModelError.INVALID_ATTRIBUTES);
            assert.deepEqual(e.data, {
                invalidAttributes: {
                    assignedTo: {
                        code: "INVALID_ATTRIBUTE",
                        data: {},
                        message:
                            'Entity attribute "assignedTo" accepts multiple Entity classes but classId attribute is missing.'
                    }
                }
            });
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    it("must be able to set null as value", async () => {
        const main = new Main();
        main.assignedTo = new A().populate({ name: "a" });
        assert.equal(main.assignedToClassId, "A");
        assert.equal(await main.get("assignedTo.name"), "a");

        main.assignedTo = null;
        assert.equal(main.assignedToClassId, null);
        assert.isNull(await main.assignedTo);

        // Should not throw error.
        await main.validate();
    });
});
