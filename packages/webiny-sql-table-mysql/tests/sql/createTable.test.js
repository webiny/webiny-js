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

import { createTable } from "webiny-sql-table-mysql/sql";

describe("CREATE TABLE SQL test", () => {
    test("should create statements correctly", async () => {
        const userTable = new UserTable();
        expect(createTable(userTable)).toEqual(userTableSql);

        const complexTable = new ComplexTable();
        expect(createTable(complexTable)).toEqual(complexTableSql);

        const companyTable = new CompanyTable();
        expect(createTable(companyTable)).toEqual(companyTableSql);

        const completeTable = new CompleteTable();
        expect(createTable(completeTable)).toEqual(completeTableSql);
    });
});
