import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
const sandbox = sinon.createSandbox();
import { collection, findCursor } from "./database";
import mdbid from "mdbid";

describe("findById test", function() {
    afterEach(() => {
        sandbox.restore();
        findCursor.data = [];
    });
    beforeEach(() => SimpleModel.getStoragePool().flush());

    it("must generate correct query", async () => {
        const findOneSpy = sandbox.spy(collection, "find");

        const id = mdbid();
        await SimpleModel.findById(id);

        expect(findOneSpy.getCall(0).args[0]).toEqual({
            id
        });

        findOneSpy.restore();
    });

    it("findById - should find previously inserted model", async () => {
        const xyz = mdbid();

        const findOneStub = sandbox.stub(collection, "find").callsFake(() => {
            findCursor.data = [
                {
                    id: xyz,
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: true
                }
            ];

            return findCursor;
        });

        const simpleModel = await SimpleModel.findById(xyz);
        findOneStub.restore();

        expect(simpleModel.id).toBe(xyz);
        expect(simpleModel.name).toBe("This is a test");
        expect(simpleModel.slug).toBe("thisIsATest");
        expect(simpleModel.enabled).toBe(true);
    });
});
