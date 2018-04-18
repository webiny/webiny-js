import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("findById test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.findById("customId");

        assert.deepEqual(
            queryStub.getCall(0).args[0],
            "SELECT * FROM `SimpleEntity` WHERE (`id` = 'customId') LIMIT 1"
        );

        queryStub.restore();
    });

    it("findById - should find previously inserted entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => [
            {
                id: 1,
                name: "This is a test",
                slug: "thisIsATest",
                enabled: 1
            }
        ]);

        const simpleEntity = await SimpleEntity.findById(1);
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, "This is a test");
        assert.equal(simpleEntity.slug, "thisIsATest");
        assert.isTrue(simpleEntity.enabled);
    });
});
