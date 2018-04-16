import { assert } from "chai";
import { Insert } from "../../src/statements";
import { operators } from "../../src";

describe("INSERT statement test", function() {
    it("should generate an INSERT statement", async () => {
        const sql = new Insert({
            operation: "insert",
            operators,
            table: "TestTable",
            data: { name: "Test", enabled: 1 }
        }).generate();

        assert.equal(sql, "INSERT INTO `TestTable` (`name`, `enabled`) VALUES ('Test', 1)");
    });

    it("should generate an INSERT statement and preserve false in query", async () => {
        const sql = new Insert(
            {
                operation: "insert",
                table: "TestTable",
                data: { name: "Test", enabled: false }
            },
            operators
        ).generate();

        assert.equal(sql, "INSERT INTO `TestTable` (`name`, `enabled`) VALUES ('Test', false)");
    });

    it('should generate an INSERT statement with ON DUPLICATE KEY UPDATE (aka "UPSERT")', async () => {
        const sql = new Insert(
            {
                operation: "insert",
                onDuplicateKeyUpdate: true,
                table: "TestTable",
                data: { name: "Test", enabled: false }
            },
            operators
        ).generate();

        assert.equal(
            sql,
            "INSERT INTO `TestTable` (`name`, `enabled`) VALUES ('Test', false) ON DUPLICATE KEY UPDATE name = 'Test', enabled = false"
        );
    });
});
