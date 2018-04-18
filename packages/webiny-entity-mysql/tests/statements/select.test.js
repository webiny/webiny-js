import { assert } from "chai";
import { Select } from "../../src/statements";
import { operators } from "../../src";
import { Entity } from "webiny-entity";

describe("SELECT statement test", function() {
    it("should generate a SELECT statement", async () => {
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
        assert.equal(
            sql,
            "SELECT * FROM `TestTable` WHERE (`name` = 'Test' AND `enabled` = true AND `deletedOn` IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10"
        );

        params.columns = ["name", "enabled"];
        sql = new Select(params, Entity).generate();

        assert.equal(
            sql,
            "SELECT name, enabled FROM `TestTable` WHERE (`name` = 'Test' AND `enabled` = true AND `deletedOn` IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10"
        );
    });
});
