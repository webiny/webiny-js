import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("findById test", function() {
    afterEach(() => sandbox.restore());

    it("findById - should find previously inserted entity", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(null, [
                    {
                        id: 1,
                        name: "This is a test",
                        slug: "thisIsATest",
                        enabled: 1
                    }
                ]);
            });
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "end").callsFake(() => {});

        const simpleEntity = await SimpleEntity.findById(1);
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
        SimpleEntity.getDriver()
            .getConnection()
            .end.restore();

        assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, "This is a test");
        assert.equal(simpleEntity.slug, "thisIsATest");
        assert.isTrue(simpleEntity.enabled);
    });
});
