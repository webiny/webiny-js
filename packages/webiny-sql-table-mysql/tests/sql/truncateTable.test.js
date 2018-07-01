import { UserTable } from "./../tables";
import { truncateTable } from "webiny-sql-table-mysql/sql";

describe("TRUNCATE TABLE SQL test", () => {
    test("should truncate statements correctly", async () => {
        const userTable = new UserTable();
        expect(truncateTable(userTable)).toEqual("TRUNCATE TABLE `Users`;");
    });
});
