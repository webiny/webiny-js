import { assert } from "chai";
import { Table as BaseTable } from "webiny-sql-table";
import { MySQLDriver } from "./..";

class ConnectionlessTable extends BaseTable {}

ConnectionlessTable.setDriver(new MySQLDriver());

describe("execute query test", function() {
    it("must throw an error if connection is not set", async () => {
        const table = new ConnectionlessTable();
        try {
            await table.create();
        } catch (e) {
            assert.equal(e.message, "MySQL connection not set.");
            return;
        }
        throw Error("Error should've been thrown.");
    });
});
