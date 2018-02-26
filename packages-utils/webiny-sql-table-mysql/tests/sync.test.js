import { assert } from "chai";
import { UserTable, Table } from "./tables";

describe("sync table test", function() {
    it("should return only SQL when setting returnSQL option to true", async () => {
        const userTable = new UserTable();
        const sql = await userTable.sync({ returnSQL: true });
        assert.equal(sql, "SYNC TABLE `Users`");
    });
});
