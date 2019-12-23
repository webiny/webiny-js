import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
import { collection } from "./database";
import mbdbid from "mdbid";

const sandbox = sinon.createSandbox();

describe("findById error test", function() {
    afterEach(() => sandbox.restore());

    it("findById - should throw an error", async () => {
        const findByIdStub = sandbox.stub(collection, "find").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            const oneTwoThree = mbdbid();
            await SimpleModel.findById(oneTwoThree);
        } catch (e) {
            return;
        } finally {
            findByIdStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
