import { assert } from "chai";

import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();
import { collection, findCursor } from "./database";

describe("findByIds test", function() {
    afterEach(() => {
        sandbox.restore();
        findCursor.data = [];
    });
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    it("must generate correct query", async () => {
        const findOneSpy = sandbox.spy(collection, "findOne");
        const countSpy = sandbox.spy(collection, "countDocuments");
        await SimpleEntity.findByIds(["a", "b", "c"]);

        assert.deepEqual(findOneSpy.getCall(0).args[0], {
            id: "a"
        });

        assert.deepEqual(findOneSpy.getCall(1).args[0], {
            id: "b"
        });

        assert.deepEqual(findOneSpy.getCall(2).args[0], {
            id: "c"
        });

        assert.equal(countSpy.callCount, 0);
        countSpy.restore();
        findOneSpy.restore();
    });

    it("findByIds - should find previously inserted entities", async () => {
        const findOneSpy = sandbox
            .stub(collection, "findOne")
            .onCall(0)
            .callsFake(() => {
                return {
                    id: "57eb6814c4ddf57b1c6697a9",
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: true
                };
            })
            .onCall(1)
            .callsFake(() => {
                return {
                    id: "57eb6814c4ddf57b1c6697aa",
                    name: "This is a test 222",
                    slug: "thisIsATest222",
                    enabled: false
                };
            });

        const simpleEntities = await SimpleEntity.findByIds([
            "57eb6814c4ddf57b1c6697a9",
            "57eb6814c4ddf57b1c6697aa"
        ]);
        findCursor.data = [];

        assert.equal(simpleEntities[0].id, "57eb6814c4ddf57b1c6697a9");
        assert.equal(simpleEntities[0].name, "This is a test");
        assert.equal(simpleEntities[0].slug, "thisIsATest");
        assert.isTrue(simpleEntities[0].enabled);

        assert.equal(simpleEntities[1].id, "57eb6814c4ddf57b1c6697aa");
        assert.equal(simpleEntities[1].name, "This is a test 222");
        assert.equal(simpleEntities[1].slug, "thisIsATest222");
        assert.isFalse(simpleEntities[1].enabled);
    });
});
