import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
const sandbox = sinon.createSandbox();
import { collection } from "./database";

describe("save error test", function() {
    afterEach(() => sandbox.restore());

    it("should save new model but an exception must be thrown", async () => {
        const insertOneStub = sandbox.stub(collection, "insertOne").callsFake(() => {
            throw Error("This is an error.");
        });

        const simpleModel = new SimpleModel();
        try {
            await simpleModel.save();
        } catch (e) {
            return;
        } finally {
            insertOneStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });

    it("should update existing model but an exception must be thrown", async () => {
        const insertOneStub = sandbox.stub(collection, "insertOne").callsFake(() => {});

        const simpleModel = new SimpleModel();
        await simpleModel.save();
        insertOneStub.restore();

        const updateOneStub = sandbox.stub(collection, "updateOne").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            simpleModel.name = "test2";
            await simpleModel.save();
        } catch (e) {
            return;
        } finally {
            updateOneStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
