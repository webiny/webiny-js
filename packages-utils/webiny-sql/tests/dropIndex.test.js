import { assert } from "chai";
import { DropIndex } from "./..";

describe("DROP INDEX statement test", function() {
    it("should generate a DROP INDEX statement", async () => {
        const sql = new DropIndex({ table: "TestTable", name: "TestIndex" }).generate();
        assert.equal(sql, `ALTER TABLE \`TestTable\` DROP INDEX \`TestIndex\``);
    });
});
