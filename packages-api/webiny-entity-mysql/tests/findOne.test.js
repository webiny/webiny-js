import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";

const sandbox = sinon.sandbox.create();

describe("findOne test", function() {
    afterEach(() => sandbox.restore());

    it("findOne - should find previously inserted entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {
            return [
                {
                    id: 1,
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: 1
                }
            ];
        });

        const simpleEntity = await SimpleEntity.findOne({ query: { id: 1 } });
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, "This is a test");
        assert.equal(simpleEntity.slug, "thisIsATest");
        assert.isTrue(simpleEntity.enabled);
    });
});
