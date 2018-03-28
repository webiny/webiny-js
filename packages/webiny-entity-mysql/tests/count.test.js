import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";

const sandbox = sinon.sandbox.create();

describe("count test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.count();

        assert.deepEqual(
            queryStub.getCall(0).args[0],
            "SELECT COUNT(*) AS count FROM `SimpleEntity`"
        );

        queryStub.restore();
    });

    it("should count entities", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {
            return [{ count: 1 }];
        });

        const count = await SimpleEntity.count();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.equal(count, 1);
    });

    it("should include search query if passed", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.count({
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
            "SELECT COUNT(*) AS count FROM `SimpleEntity` WHERE (((name LIKE '%this is%') AND age > 30))"
        );

        queryStub.restore();
    });
});
