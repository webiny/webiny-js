import { assert } from "chai";
import { UserTable } from "./../tables";
import { tableExists } from "./../../src/sql";

describe("table exists SQL test", function() {
    it("should generate table exists statements correctly", async () => {
        const userTable = new UserTable();
        assert.equal(tableExists(userTable), `SHOW TABLES LIKE \`Users\``);
    });
});
