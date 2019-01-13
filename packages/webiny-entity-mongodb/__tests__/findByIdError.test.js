import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import { collection } from "./database";

const sandbox = sinon.sandbox.create();

describe("findById error test", function() {
    afterEach(() => sandbox.restore());

    it("findById - should throw an error", async () => {
        const findByIdStub = sandbox.stub(collection, "findOne").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleEntity.findById(123);
        } catch (e) {
            return;
        } finally {
            findByIdStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
