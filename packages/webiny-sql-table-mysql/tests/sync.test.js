import mysql from "mysql";
import _ from "lodash";
import { UserTable, userTableSql, Table } from "./tables";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("sync table test", () => {
    afterEach(() => sandbox.restore());
    test("create table - should return only SQL when setting returnSQL option to true", async () => {
        const connectionStub = sandbox.stub(UserTable.getDriver(), "execute").callsFake(() => []);

        const userTable = new UserTable();
        const sql = await userTable.sync({ returnSQL: true });

        connectionStub.restore();
        expect(connectionStub.callCount).toEqual(1);
        expect(sql).toEqual(userTableSql);
    });

    test("create table - should execute SQL", async () => {
        const connectionStub = sandbox.stub(UserTable.getDriver(), "execute").callsFake(() => []);

        const userTable = new UserTable();
        const results = await userTable.sync();
        connectionStub.restore();
        expect(connectionStub.callCount).toEqual(2);
        expect(results).toEqual([]);
    });
});
