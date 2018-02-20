import { assert } from "chai";
import { Statement } from "../../src/statements";

describe("INSERT statement test", function() {
    it("should generate an INSERT statement", async () => {
        const sql = new Statement({
            operation: "insert",
            table: "TestTable",
            data: { name: "Test", enabled: 1 }
        }).generate();

        assert.equal(sql, ``);
    });

    it("should assign empty object as a default value", async () => {
        const statement = new Statement();
        assert.deepEqual(statement.options, {});
    });
});
