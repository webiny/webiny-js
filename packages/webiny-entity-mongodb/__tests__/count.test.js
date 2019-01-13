import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import { collection, findCursor } from "./database";

const sandbox = sinon.sandbox.create();

describe("count test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const countSpy = sandbox.spy(collection, 'count');
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleEntity.find();

        await SimpleEntity.count();

        assert.isUndefined(countSpy.getCall(0).args[0])
        assert.equal(limitSpy.getCall(0).args[0], 10);
        assert.equal(skipSpy.getCall(0).args[0], 0);

        countSpy.restore();
    });

    it("should count entities", async () => {
        const countStub = sandbox.stub(collection, "count").callsFake(() => {
            return 1;
        });

        const count = await SimpleEntity.count();
        countStub.restore();

        assert.equal(count, 1);
    });

    it("should include search query if passed", async () => {
        const countSpy = sandbox.stub(collection, "count");
        await SimpleEntity.count({
            query: {
                age: { $gt: 30 }
            },
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        assert.deepEqual(countSpy.getCall(0).args[0], {
            "$and": [
                {
                    "$or": [
                        {
                            "name": {
                                "$regex": ".*this is.*",
                                "$options": "i"
                            }
                        }
                    ]
                },
                {
                    "age": {
                        "$gt": 30
                    }
                }
            ]
        });

        countSpy.restore();
    });
});
