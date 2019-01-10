import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();
import { collection } from "./database";

describe("find error test", function() {
    afterEach(() => sandbox.restore());

    it("find - an error must be thrown", async () => {
        const findStub = sandbox.stub(collection, "find").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleEntity.find();
        } catch (e) {
            return;
        } finally {
            findStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
