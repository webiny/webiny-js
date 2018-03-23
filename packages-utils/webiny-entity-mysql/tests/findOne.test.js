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

    it("findOne - should include search query if passed", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.findOne({
            query: {
                age: { $gt: 30 }
            },
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        assert.deepEqual(
            queryStub.getCall(0).args[0],
            "SELECT * FROM `SimpleEntity` WHERE (((name LIKE '%this is%') AND age > 30)) LIMIT 1"
        );

        queryStub.restore();
    });
});
