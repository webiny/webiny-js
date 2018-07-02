import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";

const sandbox = sinon.sandbox.create();

describe("search test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => SimpleEntity.getEntityPool().flush());

    test("should search entities with OR operator", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.find({
            search: {
                query: "this is",
                fields: ["name", "slug"]
            }
        });

        expect(queryStub.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE ((`name` LIKE '%this is%' OR `slug` LIKE '%this is%')) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        queryStub.restore();
    });

    test("should search entities with AND operator", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.find({
            search: {
                query: "this is",
                fields: ["name", "slug"],
                operator: "and"
            }
        });

        expect(queryStub.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE ((`name` LIKE '%this is%' AND `slug` LIKE '%this is%')) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        queryStub.restore();
    });

    test("should search entities over only one column", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.find({
            search: {
                query: "this is",
                fields: ["name"]
            }
        });

        expect(queryStub.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE ((`name` LIKE '%this is%')) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        queryStub.restore();
    });

    test("should use search and combine it with other sent query parameters", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [[], [{ count: null }]];
            });

        await SimpleEntity.find({
            search: {
                query: "this is",
                fields: ["name", "slug"],
                operator: "or"
            },
            query: {
                age: { $gt: 30 },
                country: "HR"
            }
        });

        expect(queryStub.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE (((`name` LIKE '%this is%' OR `slug` LIKE '%this is%') AND `age` > 30 AND `country` = 'HR')) LIMIT 10",
            "SELECT FOUND_ROWS() as count"
        ]);

        queryStub.restore();
    });

    test("must apply search, and also take into consideration other arguments like page, perPage, and order", async () => {
        const queryStub = sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake(() => {
                return [{}, [{ count: null }]];
            });

        await SimpleEntity.find({
            page: 3,
            perPage: 7,
            query: { age: { $lte: 30 } },
            sort: { createdOn: -1, id: 1 },
            search: {
                query: "this is",
                fields: ["name", "slug"],
                operator: "or"
            }
        });

        expect(queryStub.getCall(0).args[0]).toEqual([
            "SELECT SQL_CALC_FOUND_ROWS * FROM `SimpleEntity` WHERE (((`name` LIKE '%this is%' OR `slug` LIKE '%this is%') AND `age` <= 30)) ORDER BY createdOn DESC, id ASC LIMIT 7 OFFSET 14",
            "SELECT FOUND_ROWS() as count"
        ]);
    });
});
