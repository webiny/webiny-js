import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
const sandbox = sinon.createSandbox();
import { collection } from "./database";

describe("find error test", function() {
    afterEach(() => sandbox.restore());

    it("find - an error must be thrown", async () => {
        const findStub = sandbox.stub(collection, "find").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleModel.find();
        } catch (e) {
            return;
        } finally {
            findStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
