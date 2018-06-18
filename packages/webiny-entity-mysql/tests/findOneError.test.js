import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("findOne error test", () => {
    afterEach(() => sandbox.restore());

    test("findOne - should find previously inserted entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            await SimpleEntity.findOne({ query: { id: 1 } });
        } catch (e) {
            return;
        } finally {
            SimpleEntity.getDriver()
                .getConnection()
                .query.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
