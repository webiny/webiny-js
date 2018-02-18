import { assert } from "chai";
import { CreateIndex } from "./..";

describe("CREATE INDEX statement test", function() {
    it("should generate a CREATE INDEX statement", async () => {
        const sql = new CreateIndex({
            type: "unique",
            table: "TestTable",
            name: "TestIndex",
            columns: ["one", "two", "three"]
        }).generate();
        assert.equal(sql, `CREATE UNIQUE INDEX \`TestIndex\` ON \`TestTable\` (one, two, three)`);
    });

    it("should generate a CREATE INDEX statement without index type / columns", async () => {
        const sql = new CreateIndex({
            table: "TestTable",
            name: "TestIndex"
        }).generate();
        assert.equal(sql, `CREATE  INDEX \`TestIndex\` ON \`TestTable\` ()`);
    });
});
