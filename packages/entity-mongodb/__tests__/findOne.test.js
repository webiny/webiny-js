import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import { database, collection, findCursor } from "./database";

const sandbox = sinon.sandbox.create();

describe("findOne test", function() {
    afterEach(() => {
        sandbox.restore();
        findCursor.data = [];
    });

    beforeEach(() => SimpleEntity.getEntityPool().flush());
    it("findOne - must generate correct query", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        const findOneSpy = sandbox.spy(collection, "find");

        await SimpleEntity.findOne();

        const databaseArg = collectionSpy.getCall(0).args[0];
        const findArg = findOneSpy.getCall(0).args[0];

        assert.equal(databaseArg, "SimpleEntity");
        assert.isUndefined(findArg);

        collectionSpy.restore();
        findOneSpy.restore();
    });

    it("findOne - should find previously inserted entity", async () => {
        const findOneStub = sandbox.stub(collection, "find").callsFake(() => {
            findCursor.data = [
                {
                    id: 1,
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: true
                }
            ];
            return findCursor;
        });

        const simpleEntity = await SimpleEntity.findOne({ query: { id: 1 } });
        findOneStub.restore();

        assert.equal(simpleEntity.id, 1);
        assert.equal(simpleEntity.name, "This is a test");
        assert.equal(simpleEntity.slug, "thisIsATest");
        assert.isTrue(simpleEntity.enabled);
    });

    it("findOne - should include search query if passed", async () => {
        const findOneSpy = sandbox.spy(collection, "find");

        await SimpleEntity.findOne({
            query: {
                age: { $gt: 30 }
            },
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        assert.deepEqual(findOneSpy.getCall(0).args[0], {
            $and: [
                {
                    $or: [
                        {
                            name: {
                                $regex: ".*this is.*",
                                $options: "i"
                            }
                        }
                    ]
                },
                {
                    age: {
                        $gt: 30
                    }
                }
            ]
        });
    });
});
