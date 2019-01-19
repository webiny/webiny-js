import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();
import { collection } from "./database";

describe("count error test", function() {
    it("count - an error must be thrown", async () => {
        const countStub = sandbox.stub(collection, "countDocuments").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleEntity.count();
        } catch (e) {
            return;
        } finally {
            countStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
