import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";

const sandbox = sinon.sandbox.create();

describe("findOne test", () => {
    afterEach(() => sandbox.restore());

    test("findOne - must generate correct query", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.findOne();

        expect(queryStub.getCall(0).args[0]).toEqual("SELECT * FROM `SimpleEntity` LIMIT 1");

        queryStub.restore();
    });

    test("findOne - should find previously inserted entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {
            return [
                {
                    id: 1,
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: 1
                }
            ];
        });

        const simpleEntity = await SimpleEntity.findOne({ query: { id: 1 } });
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        expect(simpleEntity.id).toEqual(1);
        expect(simpleEntity.name).toEqual("This is a test");
        expect(simpleEntity.slug).toEqual("thisIsATest");
        expect(simpleEntity.enabled).toBe(true);
    });

    test("findOne - should include search query if passed", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.findOne({
            query: {
                age: { $gt: 30 }
            },
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        expect(queryStub.getCall(0).args[0]).toEqual(
            "SELECT * FROM `SimpleEntity` WHERE (((`name` LIKE '%this is%') AND `age` > 30)) LIMIT 1"
        );

        queryStub.restore();
    });

    test("findOne - make sure sorters are properly added", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.findOne({
            query: {
                age: { $gt: 30 }
            },
            search: {
                query: "this is",
                fields: ["name"]
            },
            page: 3,
            perPage: 7,
            sort: { createdOn: -1, id: 1 }
        });

        expect(queryStub.getCall(0).args[0]).toEqual(
            "SELECT * FROM `SimpleEntity` WHERE (((`name` LIKE '%this is%') AND `age` > 30)) ORDER BY createdOn DESC, id ASC LIMIT 1 OFFSET 2"
        );

        queryStub.restore();
    });
});
