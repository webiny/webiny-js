import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
const sandbox = sinon.createSandbox();
import { collection } from "./database";

describe("count error test", function() {
    it("count - an error must be thrown", async () => {
        const countStub = sandbox.stub(collection, "countDocuments").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleModel.count();
        } catch (e) {
            return;
        } finally {
            countStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
