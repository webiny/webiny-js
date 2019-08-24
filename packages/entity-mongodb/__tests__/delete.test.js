import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import { assert } from "chai";
import { collection } from "./database";

const sandbox = sinon.sandbox.create();

const simpleEntity = new SimpleEntity();

describe("delete test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const deleteSpy = sandbox
            .spy(collection, "deleteOne");

        const simpleEntity = new SimpleEntity();
        simpleEntity.id = "507f1f77bcf86cd799439011";
        await simpleEntity.delete();

        assert.deepEqual(
            deleteSpy.getCall(0).args[0],
            {id: simpleEntity.id}
        );

        deleteSpy.restore();
    });

    it("should throw an exception because entity was not previously saved", async () => {
        try {
            await simpleEntity.delete();
        } catch (e) {
            return;
        }
        throw Error(`Error should've been thrown.`);
    });
});
