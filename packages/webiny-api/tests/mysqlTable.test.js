import { expect } from "chai";
import MySQLTable from "./../src/tables/mySQL";
import { CharColumn, DateTimeColumn, TinyIntColumn } from "webiny-sql-table-mysql/src/columns";

describe("ApiErrorResponse class test", function() {
    it("on construct - data, message and statusCode must be correctly set", () => {
        const blankTable = new MySQLTable();

        expect(blankTable.getColumn("id")).to.be.instanceOf(CharColumn);
        expect(blankTable.getColumn("createdOn")).to.be.instanceOf(DateTimeColumn);
        expect(blankTable.getColumn("savedOn")).to.be.instanceOf(DateTimeColumn);
        expect(blankTable.getColumn("updatedOn")).to.be.instanceOf(DateTimeColumn);
        expect(blankTable.getColumn("deleted")).to.be.instanceOf(TinyIntColumn);
    });
});
