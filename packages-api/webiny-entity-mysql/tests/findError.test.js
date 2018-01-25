import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("find error test", function() {
    afterEach(() => sandbox.restore());

    it("find - an error must be thrown", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(new Error("This is an error."));
            });
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "end").callsFake(() => {});

        try {
            await SimpleEntity.find();
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
