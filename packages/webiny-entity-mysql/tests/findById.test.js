import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
const sandbox = sinon.sandbox.create();

describe("findById test", () => {
    afterEach(() => sandbox.restore());

    test("must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.findById("customId");

        expect(queryStub.getCall(0).args[0]).toEqual(
            "SELECT * FROM `SimpleEntity` WHERE (`id` = 'customId') LIMIT 1"
        );

        queryStub.restore();
    });

    test("findById - should find previously inserted entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => [
            {
                id: 1,
                name: "This is a test",
                slug: "thisIsATest",
                enabled: 1
            }
        ]);

        const simpleEntity = await SimpleEntity.findById(1);
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        expect(simpleEntity.id).toEqual(1);
        expect(simpleEntity.name).toEqual("This is a test");
        expect(simpleEntity.slug).toEqual("thisIsATest");
        expect(simpleEntity.enabled).toBe(true);
    });
});
