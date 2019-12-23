import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
import { collection } from "./database";
import { withAggregate } from "@commodo/fields-storage-mongodb";

const sandbox = sinon.createSandbox();

describe("aggregate test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const aggSpy = sandbox.spy(collection, "aggregate");
        const SimpleModelWithAggregate = withAggregate()(SimpleModel);
        await SimpleModelWithAggregate.aggregate([{ $match: { something: 123 } }, { $limit: 10 }]);
        expect(aggSpy.getCall(0).args[0]).toEqual([{ $match: { something: 123 } }, { $limit: 10 }]);
        aggSpy.restore();
    });
});
