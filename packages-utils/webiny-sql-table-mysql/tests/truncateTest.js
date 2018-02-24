import { assert } from "chai";
import { UserTable, Table } from "./tables";
import sinon from "sinon";
import mysql from "mysql";
import { Table as BaseTable } from "webiny-sql-table";
import { MySQLDriver } from "./..";

const sandbox = sinon.sandbox.create();

describe("truncate table test", function() {
    afterEach(() => {
        sandbox.restore();
    });

    it("should truncate table correctly", async () => {
        const userTable = new UserTable();

        const sqlQueries = {
            truncate: ""
        };

        const truncateStub = sandbox
            .stub(userTable.getDriver().getConnection(), "query")
            .callsFake(sql => {
                sqlQueries.truncate = sql;
            });

        await userTable.truncate();
        truncateStub.restore();

        assert.deepEqual(sqlQueries, {
            truncate: "TRUNCATE TABLE `Users`"
        });
    });

    it("should return only SQL when setting returnSQL option to true", async () => {
        const userTable = new UserTable();
        const sql = await userTable.truncate({ returnSQL: true });
        assert.equal(sql, "TRUNCATE TABLE `Users`");
    });
});
