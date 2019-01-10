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
        const findSpy = sandbox.spy(collection, "find");
        const countSpy = sandbox.spy(collection, "count");
        await SimpleEntity.findByIds(["a", "b", "c"]);

        assert.deepEqual(findSpy.getCall(0).args[0], {
            id: ["a", "b", "c"]
        });

        assert.equal(countSpy.callCount, 1);
        countSpy.restore();
        findSpy.restore();
    });

    it("findByIds - should find previously inserted entities", async () => {
        findCursor.data = [
            {
                id: 1,
                name: "This is a test",
                slug: "thisIsATest",
                enabled: true
            },
            {
                id: 2,
                name: "This is a test 222",
                slug: "thisIsATest222",
                enabled: false
            }
        ];

        const simpleEntities = await SimpleEntity.findByIds([1, 2]);
        findCursor.data = [];

        assert.equal(simpleEntities[0].id, 1);
        assert.equal(simpleEntities[0].name, "This is a test");
        assert.equal(simpleEntities[0].slug, "thisIsATest");
        assert.isTrue(simpleEntities[0].enabled);

        assert.equal(simpleEntities[1].id, 2);
        assert.equal(simpleEntities[1].name, "This is a test 222");
        assert.equal(simpleEntities[1].slug, "thisIsATest222");
        assert.isFalse(simpleEntities[1].enabled);
    });
});
