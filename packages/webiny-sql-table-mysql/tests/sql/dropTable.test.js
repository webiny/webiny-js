import { assert } from "chai";
import { UserTable } from "./../tables";
import { dropTable } from "./../../src/sql";

describe("DROP TABLE SQL test", function() {
    it("should drop statements correctly", async () => {
        const userTable = new UserTable();
        assert.equal(dropTable(userTable), "DROP TABLE IF EXISTS `Users`;");
    });
});
