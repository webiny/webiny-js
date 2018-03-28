import { assert } from "chai";
import {
    UserTable,
    userTableSql,
    ComplexTable,
    complexTableSql,
    CompanyTable,
    companyTableSql,
    CompleteTable,
    completeTableSql
} from "./../tables";

import { createTable } from "./../../src/sql";

describe("CREATE TABLE SQL test", function() {
    it("should create statements correctly", async () => {
        const userTable = new UserTable();
        assert.equal(createTable(userTable), userTableSql);

        const complexTable = new ComplexTable();
        assert.equal(createTable(complexTable), complexTableSql);

        const companyTable = new CompanyTable();
        assert.equal(createTable(companyTable), companyTableSql);

        const completeTable = new CompleteTable();
        assert.equal(createTable(completeTable), completeTableSql);
    });
});
