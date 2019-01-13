import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();
import { collection } from "./database";

describe("findByIds error test", function() {
    afterEach(() => sandbox.restore());

    it("findByIds - should throw an error", async () => {
        const findStub = sandbox.stub(collection, "find").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleEntity.findByIds([123]);
        } catch (e) {
            return;
        } finally {
            findStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
