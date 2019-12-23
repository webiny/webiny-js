import sinon from "sinon";
import SimpleModel from "./models/simpleModel";
import { collection } from "./database";
import { WithStorageError } from "@commodo/fields-storage";
const sandbox = sinon.createSandbox();

describe("delete test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const deleteSpy = sandbox.spy(collection, "deleteOne");

        const simpleModel = new SimpleModel();
        simpleModel.id = "507f1f77bcf86cd799439011";
        await simpleModel.delete();

        expect(deleteSpy.getCall(0).args[0]).toEqual({ id: simpleModel.id });

        deleteSpy.restore();
    });

    it("should throw an exception because model was not previously saved", async () => {
        try {
            const simpleModel = new SimpleModel();
            await simpleModel.delete();
        } catch (e) {
            expect(e.code).toBe(WithStorageError.CANNOT_DELETE_NO_ID);
            return;
        }
        throw Error(`Error should've been thrown.`);
    });
});
