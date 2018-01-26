import { assert } from "chai";

import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("findByIds test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    it("findByIds - should find previously inserted entities", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(
                    null,
                    [
                        {
                            id: 1,
                            name: "This is a test",
                            slug: "thisIsATest",
                            enabled: 1
                        },
                        {
                            id: 2,
                            name: "This is a test 222",
                            slug: "thisIsATest222",
                            enabled: 0
                        }
                    ],
                    null
                );
            });

        sandbox.stub(SimpleEntity.getDriver().getConnection(), "end").callsFake(() => {});

        const simpleEntities = await SimpleEntity.findByIds([1, 2]);
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
        SimpleEntity.getDriver()
            .getConnection()
            .end.restore();

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
