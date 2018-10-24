import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";

const sandbox = sinon.sandbox.create();

describe("find test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    test("find - must generate simple query correctly", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.find();

        expect(queryStub.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        queryStub.restore();
    });

    test("find - must generate correct query - must have GROUP BY included", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.find({ groupBy: ["something"] });

        expect(queryStub.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` GROUP BY something LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        queryStub.restore();
    });

    test("should find entities and total count", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => [
            [
                {
                    id: 1,
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: 1
                },
                {
                    id: 2,
                    name: "This is a test 222",
                    slug: "thisIsATest222",
                    enabled: 0
                }
            ],
            [
                {
                    count: 2
                }
            ]
        ]);

        const entities = await SimpleEntity.find();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBe(2);

        expect(entities[0].id).toEqual(1);
        expect(entities[0].name).toEqual("This is a test");
        expect(entities[0].slug).toEqual("thisIsATest");
        expect(entities[0].enabled).toBe(true);

        expect(entities[1].id).toEqual(2);
        expect(entities[1].name).toEqual("This is a test 222");
        expect(entities[1].slug).toEqual("thisIsATest222");
        expect(entities[1].enabled).toBe(false);
    });

    test("must change page and perPage parameters into limit / offset accordingly", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });
        await SimpleEntity.find({
            page: 3,
            perPage: 7,
            query: { age: 30 },
            sort: { createdOn: -1, id: 1 }
        });

        expect(querySpy.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE (`age` = 30) ORDER BY createdOn DESC, id ASC LIMIT 7 OFFSET 14",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    test("JSON - find single value in an array", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });
        await SimpleEntity.find({
            query: { tags: "user" }
        });

        expect(querySpy.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE (JSON_SEARCH(`tags`, 'one', 'user') IS NOT NULL) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    test("JSON - find exact array value", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });

        await SimpleEntity.find({
            query: { tags: ["user", "avatar"] }
        });

        expect(querySpy.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE (`tags` = JSON_ARRAY('user', 'avatar')) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    test("JSON - match at least one array value inside the target array", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });

        await SimpleEntity.find({
            query: { tags: { $in: ["user", "avatar"] } }
        });

        expect(querySpy.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE ((JSON_SEARCH(`tags`, 'one', 'user') IS NOT NULL OR JSON_SEARCH(`tags`, 'one', 'avatar') IS NOT NULL)) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    test("JSON - match all array values inside the target array", async () => {
        const querySpy = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: 0 }]];
            });

        await SimpleEntity.find({
            query: { tags: { $all: ["user", "avatar"] } }
        });

        expect(querySpy.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE ((JSON_SEARCH(`tags`, 'one', 'user') IS NOT NULL AND JSON_SEARCH(`tags`, 'one', 'avatar') IS NOT NULL)) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });
});
