import { assert } from "chai";
import { UserTable, userTableSql, Table } from "./tables";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("sync table test", function() {
    afterEach(() => sandbox.restore());
    it("create table - should return only SQL when setting returnSQL option to true", async () => {
        const connectionStub = sandbox.stub(UserTable.getDriver(), "execute").callsFake(() => []);

        const userTable = new UserTable();
        const sql = await userTable.sync({ returnSQL: true });

        connectionStub.restore();
        assert.equal(connectionStub.callCount, 1);
        assert.equal(sql, userTableSql);
    });

    it("create table - should execute SQL", async () => {
        const connectionStub = sandbox.stub(UserTable.getDriver(), "execute").callsFake(() => []);

        const userTable = new UserTable();
        const results = await userTable.sync();
        connectionStub.restore();
        assert.equal(connectionStub.callCount, 2);
        assert.deepEqual(results, []);
    });
});
