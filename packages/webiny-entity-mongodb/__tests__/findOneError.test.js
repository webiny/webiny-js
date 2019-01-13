import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();
import { collection } from "./database";

describe("findOne error test", function() {
    afterEach(() => sandbox.restore());

    it("findOne - should find previously inserted entity", async () => {

        const findOneStub = sandbox.stub(collection, "findOne").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleEntity.findOne({ query: { id: 1 } });
        } catch (e) {
            return;
        } finally {
            findOneStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
