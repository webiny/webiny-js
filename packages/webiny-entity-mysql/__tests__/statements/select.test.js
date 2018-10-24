import { Select } from "webiny-entity-mysql/statements";
import { operators } from "webiny-entity-mysql";
import { Entity } from "webiny-entity";

describe("SELECT statement test", () => {
    test("should generate a SELECT statement", async () => {
        const params = {
            operation: "select",
            operators,
            table: "TestTable",
            where: { name: "Test", enabled: true, deletedOn: null },
            limit: 10,
            offset: 0,
            sort: { name: -1, createdOn: 1 }
        };

        let sql = new Select(params, Entity).generate();
        expect(sql).toEqual(
            "SELECT * FROM `TestTable` WHERE (`name` = 'Test' AND `enabled` = true AND `deletedOn` IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10"
        );

        params.columns = ["name", "enabled"];
        sql = new Select(params, Entity).generate();

        expect(sql).toEqual(
            "SELECT name, enabled FROM `TestTable` WHERE (`name` = 'Test' AND `enabled` = true AND `deletedOn` IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10"
        );
    });

    test("should generate a SELECT statement with GROUP BY", async () => {
        const params = {
            operation: "select",
            operators,
            table: "TestTable",
            where: { name: "Test", enabled: true, deletedOn: null },
            limit: 10,
            offset: 0,
            sort: { name: -1, createdOn: 1 },
            groupBy: ["parent"]
        };

        let sql = new Select(params, Entity).generate();
        expect(sql).toEqual(
            "SELECT * FROM `TestTable` WHERE (`name` = 'Test' AND `enabled` = true AND `deletedOn` IS NULL) GROUP BY parent ORDER BY name DESC, createdOn ASC LIMIT 10"
        );

        params.columns = ["name", "enabled"];
        sql = new Select(params, Entity).generate();

        expect(sql).toEqual(
            "SELECT name, enabled FROM `TestTable` WHERE (`name` = 'Test' AND `enabled` = true AND `deletedOn` IS NULL) GROUP BY parent ORDER BY name DESC, createdOn ASC LIMIT 10"
        );
    });
});
