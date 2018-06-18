import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

const simpleEntity = new SimpleEntity();

describe("delete test", () => {
    afterEach(() => sandbox.restore());

    test("must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        const simpleEntity = new SimpleEntity();
        simpleEntity.id = "507f1f77bcf86cd799439011";
        await simpleEntity.delete();

        expect(queryStub.getCall(0).args[0]).toEqual(
            "DELETE FROM `SimpleEntity` WHERE (`id` = '507f1f77bcf86cd799439011') LIMIT 1"
        );

        queryStub.restore();
    });

    test("should throw an exception because entity was not previously saved", async () => {
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

    test("should delete entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {
            return { insertId: 1 };
        });

        const simpleEntity = new SimpleEntity();
        simpleEntity.name = "This is a test";
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {});

        await simpleEntity.delete();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });
});
