import { assert } from "chai";
import { UserTable, userTableSql } from "./../tables";
import { createTable } from "./../../src/sql";

describe("CREATE TABLE SQL test", function() {
    it("should create statements correctly", async () => {
        const userTable = new UserTable();
        assert.equal(createTable(userTable), userTableSql);
    });
});
