import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
const sandbox = sinon.createSandbox();
import { collection } from "./database";

describe("delete error test", function() {
    afterEach(() => sandbox.restore());

    it("should throw an error", async () => {
        const simpleModel = new SimpleModel();
        simpleModel.name = "This is a test";
        await simpleModel.save();

        const deleteOneStub = sandbox.stub(collection, "deleteOne").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await simpleModel.delete();
        } catch (e) {
            expect(e.message).toBe("This is an error.");
            return;
        } finally {
            deleteOneStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
