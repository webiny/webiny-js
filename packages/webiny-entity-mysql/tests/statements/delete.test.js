import { assert } from "chai";
import { Delete } from "../../src/statements";
import { operators } from "../../src";
import { Entity } from "webiny-entity";

describe("DELETE statement test", function() {
    it("should generate a DELETE statement", async () => {
        const sql = new Delete(
            {
                operation: "delete",
                operators,
                table: "TestTable",
                where: { name: "Test", enabled: true, deletedOn: null },
                limit: 10,
                offset: 0,
                sort: { name: -1, createdOn: 1 }
            },
            Entity
        ).generate();

        assert.equal(
            sql,
            "DELETE FROM `TestTable` WHERE (`name` = 'Test' AND `enabled` = true AND `deletedOn` IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10"
        );
    });
});
