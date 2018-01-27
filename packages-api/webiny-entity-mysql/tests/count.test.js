import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("count test", function() {
    afterEach(() => sandbox.restore());

    it("count - should count entities", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {
            return [{ count: 1 }];
        });

        const count = await SimpleEntity.count();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.equal(count, 1);
    });
});
