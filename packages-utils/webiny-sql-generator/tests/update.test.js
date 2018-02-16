import { assert } from "chai";
import { sqlGenerator } from "./..";

describe("UPDATE statement test", function() {
    it("should generate an UPDATE statement", () => {
        const sql = sqlGenerator.build({
            operation: "update",
            table: "TestTable",
            data: { name: "Test", enabled: 1 }
        });

        assert.equal(sql, `UPDATE TestTable SET name = 'Test', enabled = 1`);
    });

    it("should generate an UPDATE statement and preserve false in query", () => {
        const sql = sqlGenerator.build({
            operation: "update",
            table: "TestTable",
            data: { name: "Test", enabled: false }
        });

        assert.equal(sql, `UPDATE TestTable SET name = 'Test', enabled = false`);
    });

    it("should generate an UPDATE statement with additional conditions", () => {
        const sql = sqlGenerator.build({
            operation: "update",
            table: "TestTable",
            data: { name: "Test", enabled: false },
            where: { $or: { age: 30, deletedOn: { $ne: null } } }
        });

        assert.equal(
            sql,
            `UPDATE TestTable SET name = 'Test', enabled = false WHERE ((age = 30 OR deletedOn IS NOT NULL))`
        );
    });
});
