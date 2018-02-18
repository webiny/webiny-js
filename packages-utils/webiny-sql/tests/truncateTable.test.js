import { assert } from "chai";
import { TruncateTable } from "./..";

describe("TRUNCATE TABLE statement test", function() {
    it("should generate a TRUNCATE TABLE statement", async () => {
        const sql = new TruncateTable({ name: "TestTable" }).generate();
        assert.equal(sql, `TRUNCATE TABLE \`TestTable\``);
    });
});
