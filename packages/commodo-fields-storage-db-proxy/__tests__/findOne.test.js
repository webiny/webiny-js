import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
import { database, collection, findCursor } from "./database";

const sandbox = sinon.createSandbox();

describe("findOne test", function() {
    afterEach(() => {
        sandbox.restore();
        findCursor.data = [];
    });

    beforeEach(() => SimpleModel.getStoragePool().flush());
    it("findOne - must generate correct query", async () => {
        const collectionSpy = sandbox.spy(database, "collection");
        // We mock 'find' because it is called internally.
        const findOneSpy = sandbox.spy(collection, "find");

        await SimpleModel.findOne();

        const databaseArg = collectionSpy.getCall(0).args[0];
        const findArg = findOneSpy.getCall(0).args[0];

        expect(databaseArg).toBe("SimpleModel");
        expect(findArg).toBe(undefined);

        collectionSpy.restore();
        findOneSpy.restore();
    });

    it("findOne - should find previously inserted model", async () => {
        // We mock 'find' because it is called internally.
        const findOneStub = sandbox.stub(collection, "find").callsFake(() => {
            findCursor.data = [
                {
                    id: "xyz",
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: true
                }
            ];
            return findCursor;
        });

        const simpleModel = await SimpleModel.findOne({ query: { id: "xyz" } });
        findOneStub.restore();

        expect(simpleModel.id).toBe("xyz");
        expect(simpleModel.name).toBe("This is a test");
        expect(simpleModel.slug).toBe("thisIsATest");
        expect(simpleModel.enabled).toBe(true);
    });

    it("findOne - should include search query if passed", async () => {
        // We mock 'find' because it is called internally.
        const findOneSpy = sandbox.spy(collection, "find");

        await SimpleModel.findOne({
            query: {
                age: { $gt: 30 }
            },
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        expect(findOneSpy.getCall(0).args[0]).toEqual({
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
