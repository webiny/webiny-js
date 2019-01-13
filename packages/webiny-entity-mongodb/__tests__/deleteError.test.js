import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();
import { collection } from "./database";

describe("delete error test", function() {
    afterEach(() => sandbox.restore());

    it("should throw an error", async () => {
        const simpleEntity = new SimpleEntity();
        simpleEntity.name = "This is a test";
        await simpleEntity.save();

        const deleteOneStub = sandbox.stub(collection, "deleteOne").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await simpleEntity.delete();
        } catch (e) {
            return;
        } finally {
            deleteOneStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
