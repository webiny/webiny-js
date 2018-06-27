import MySQLTable from "./../src/mysql";
import { CharColumn, DateTimeColumn, TinyIntColumn } from "webiny-sql-table-mysql/lib/columns";

describe("MySQL table test", function() {
    test("on construct - data, message and statusCode must be correctly set", () => {
        const blankTable = new MySQLTable();

        expect(blankTable.getColumn("id")).toBeInstanceOf(CharColumn);
        expect(blankTable.getColumn("createdOn")).toBeInstanceOf(DateTimeColumn);
        expect(blankTable.getColumn("savedOn")).toBeInstanceOf(DateTimeColumn);
        expect(blankTable.getColumn("updatedOn")).toBeInstanceOf(DateTimeColumn);
        expect(blankTable.getColumn("deleted")).toBeInstanceOf(TinyIntColumn);
    });
});
