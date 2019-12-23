import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
import { collection, findCursor } from "./database";

const sandbox = sinon.createSandbox();

describe("count test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const countSpy = sandbox.spy(collection, "countDocuments");
        const limitSpy = sandbox.spy(findCursor, "limit");
        const skipSpy = sandbox.spy(findCursor, "skip");

        await SimpleModel.find();

        await SimpleModel.count();

        expect(countSpy.getCall(0).args[0]).toBe(undefined);
        expect(limitSpy.getCall(0).args[0]).toEqual(10);
        expect(skipSpy.getCall(0).args[0]).toEqual(0);

        countSpy.restore();
    });

    it("should count models", async () => {
        const countStub = sandbox.stub(collection, "countDocuments").callsFake(() => {
            return 1;
        });

        const count = await SimpleModel.count();
        countStub.restore();

        expect(count).toBe(1);
    });

    it("should include search query if passed", async () => {
        const countSpy = sandbox.stub(collection, "countDocuments");
        await SimpleModel.count({
            query: {
                age: { $gt: 30 }
            },
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        const bbb= countSpy.getCall(0).args;
        expect(countSpy.getCall(0).args[0]).toEqual({
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

        countSpy.restore();
    });
});
