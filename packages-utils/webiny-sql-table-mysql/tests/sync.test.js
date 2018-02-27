import { assert } from "chai";
import mysql from "mysql";
import _ from "lodash";
import { UserTable, userTableSql, Table } from "./tables";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

/*const connection = mysql.createPool({
    host: "localhost",
    port: 32768,
    user: "root",
    password: "dev",
    database: "webiny",
    timezone: "Z",
    connectionLimit: 100
});*/

describe("sync table test", function() {
    afterEach(() => sandbox.restore());
    it("create table - should return only SQL when setting returnSQL option to true", async () => {
        // UserTable.getDriver().setConnection(connection);

        const connectionStub = sandbox.stub(UserTable.getDriver(), "execute").callsFake(() => []);

        const userTable = new UserTable();
        const sql = await userTable.sync({ returnSQL: true });

        connectionStub.restore();
        assert.equal(connectionStub.callCount, 1);
        assert.equal(sql, userTableSql);
    });

    it("create table - should execute SQL", async () => {
        // UserTable.getDriver().setConnection(connection);

        const connectionStub = sandbox.stub(UserTable.getDriver(), "execute").callsFake(() => []);

        const userTable = new UserTable();
        const results = await userTable.sync();
        connectionStub.restore();
        assert.equal(connectionStub.callCount, 2);
        assert.deepEqual(results, []);
    });
});
