import { Table as BaseTable } from "webiny-sql-table";
import { MySQLDriver } from "webiny-sql-table-mysql";

class ConnectionlessTable extends BaseTable {}

ConnectionlessTable.setDriver(new MySQLDriver());

describe("execute query test", () => {
    test("must throw an error if connection is not set", async () => {
        const table = new ConnectionlessTable();
        try {
            await table.create();
        } catch (e) {
            expect(e.message).toEqual("MySQL connection not set.");
            return;
        }
        throw Error("Error should've been thrown.");
    });
});
