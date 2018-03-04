import { Main, MainMissingClassIdAttribute, A, B, C } from "../../entities/multipleClassesEntities";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();
import { assert } from "chai";
import { ModelError } from "webiny-model";

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

    it("must throw an error since classId attribute is missing", async () => {
        const main = new MainMissingClassIdAttribute();
        await main.set("assignedTo", new A().populate({ name: "a" }));

        try {
            await main.validate();
        } catch (e) {
            assert.instanceOf(e, ModelError);
            assert.equal(e.type, ModelError.INVALID_ATTRIBUTES);
            assert.deepEqual(e.data, {
                invalidAttributes: {
                    assignedTo: {
                        type: "invalidAttribute",
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
});
