import { assert } from "chai";
import { DropTable } from "./..";

describe("DROP TABLE statement test", function() {
    it("should generate a DROP TABLE statement", async () => {
        const sql = new DropTable({ name: "TestTable" }).generate();
        assert.equal(sql, `DROP TABLE \`TestTable\``);
    });
});
