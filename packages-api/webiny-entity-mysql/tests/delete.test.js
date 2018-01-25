import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

const simpleEntity = new SimpleEntity();

describe("delete test", function() {
    afterEach(() => sandbox.restore());

    it("should throw an exception because entity was not previously saved", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback();
            });

        try {
            await simpleEntity.delete();
        } catch (e) {
            return;
        } finally {
            SimpleEntity.getDriver()
                .getConnection()
                .query.restore();
        }
        throw Error(`Error should've been thrown.`);
    });

    it("should delete entity", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(null, { insertId: 1 });
            });

        const simpleEntity = new SimpleEntity();
        simpleEntity.name = "This is a test";
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback();
            });

        await simpleEntity.delete();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });
});
