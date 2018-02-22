import { assert } from "chai";
import { UserTable } from "./tables";

describe("create table test", function() {
    after(() => {
        UserTable.getDriver()
            .getConnection()
            .getInstance()
            .end();
    });

    it("should create table correctly", async () => {
        const userTable = new UserTable();
        try {
            await userTable.create();
        } catch (e) {
            await userTable.delete();
        }
    });
});
