import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("findOne error test", function() {
    afterEach(() => sandbox.restore());

    it("findOne - should find previously inserted entity", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(new Error("This is an error."));
            });
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "end").callsFake(() => {});

        try {
            await SimpleEntity.findOne({ query: { id: 1 } });
        } catch (e) {
            return;
        } finally {
            SimpleEntity.getDriver()
                .getConnection()
                .query.restore();
            SimpleEntity.getDriver()
                .getConnection()
                .end.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
