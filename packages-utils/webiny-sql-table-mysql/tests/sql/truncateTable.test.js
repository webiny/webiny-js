import { assert } from "chai";
import { UserTable } from "./../tables";
import { truncateTable } from "./../../src/sql";

describe("TRUNCATE TABLE SQL test", function() {
    it("should truncate statements correctly", async () => {
        const userTable = new UserTable();
        assert.equal(truncateTable(userTable), "TRUNCATE TABLE `Users`;");
    });
});
