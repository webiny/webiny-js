import { UserTable, Table } from "./tables";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("truncate table test", () => {
    afterEach(() => {
        sandbox.restore();
    });

    test("should truncate table correctly", async () => {
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

        expect(sqlQueries).toEqual({
            truncate: "TRUNCATE TABLE `Users`;"
        });
    });

    test("should return only SQL when setting returnSQL option to true", async () => {
        const userTable = new UserTable();
        const sql = await userTable.truncate({ returnSQL: true });
        expect(sql).toEqual("TRUNCATE TABLE `Users`;");
    });
});
