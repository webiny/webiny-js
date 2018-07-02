import { UserTable, Table } from "./tables";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("drop table test", () => {
    afterEach(() => {
        sandbox.restore();
    });

    test("should drop table correctly", async () => {
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

        expect(sqlQueries).toEqual({
            drop: "DROP TABLE IF EXISTS `Users`;"
        });
    });

    test("should return only SQL when setting returnSQL option to true", async () => {
        const userTable = new UserTable();
        const sql = await userTable.drop({ returnSQL: true });
        expect(sql).toEqual("DROP TABLE IF EXISTS `Users`;");
    });
});
