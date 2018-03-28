import { assert } from "chai";
import { UserTable, Table } from "./tables";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("drop table test", function() {
    afterEach(() => {
        sandbox.restore();
    });

    it("should drop table correctly", async () => {
        const userTable = new UserTable();

        const sqlQueries = {
            drop: ""
        };

        const dropStub = sandbox
            .stub(userTable.getDriver().getConnection(), "query")
            .callsFake(sql => {
                sqlQueries.drop = sql;
            });

        await userTable.drop();
        dropStub.restore();

        assert.deepEqual(sqlQueries, {
            drop: "DROP TABLE IF EXISTS `Users`;"
        });
    });

    it("should return only SQL when setting returnSQL option to true", async () => {
        const userTable = new UserTable();
        const sql = await userTable.drop({ returnSQL: true });
        assert.equal(sql, "DROP TABLE IF EXISTS `Users`;");
    });
});
