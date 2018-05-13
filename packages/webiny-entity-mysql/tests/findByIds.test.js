import { assert } from "chai";

import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("findByIds test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    it("must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.findByIds(["a", "b", "c"]);

        assert.deepEqual(
            queryStub.getCall(0).args[0],
            "SELECT * FROM `SimpleEntity` WHERE (`id` = 'a') LIMIT 1"
        );
        assert.deepEqual(
            queryStub.getCall(1).args[0],
            "SELECT * FROM `SimpleEntity` WHERE (`id` = 'b') LIMIT 1"
        );
        assert.deepEqual(
            queryStub.getCall(2).args[0],
            "SELECT * FROM `SimpleEntity` WHERE (`id` = 'c') LIMIT 1"
        );
        assert.equal(queryStub.getCall(3), undefined);

        queryStub.restore();
    });

    it("findByIds - should find previously inserted entities", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .onCall(0)
            .callsFake(() => {
                return [
                    {
                        id: 1,
                        name: "This is a test",
                        slug: "thisIsATest",
                        enabled: 1
                    }
                ];
            })
            .onCall(1)
            .callsFake(() => {
                return [
                    {
                        id: 2,
                        name: "This is a test 222",
                        slug: "thisIsATest222",
                        enabled: 0
                    }
                ];
            });

        const simpleEntities = await SimpleEntity.findByIds([1, 2]);
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

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
