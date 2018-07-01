import { Delete } from "webiny-entity-mysql/statements";
import { operators } from "webiny-entity-mysql";
import { Entity } from "webiny-entity";

describe("DELETE statement test", () => {
    test("should generate a DELETE statement", async () => {
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

        expect(sql).toEqual(
            "DELETE FROM `TestTable` WHERE (`name` = 'Test' AND `enabled` = true AND `deletedOn` IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10"
        );
    });
});
