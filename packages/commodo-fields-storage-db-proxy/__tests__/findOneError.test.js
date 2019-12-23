import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
const sandbox = sinon.createSandbox();
import { collection } from "./database";

describe("findOne error test", function() {
    afterEach(() => sandbox.restore());

    it("findOne - should find previously inserted model", async () => {
        // We mock 'find' because it is called internally.
        const findOneStub = sandbox.stub(collection, "find").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleModel.findOne({ query: { id: 1 } });
        } catch (e) {
            return;
        } finally {
            findOneStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
