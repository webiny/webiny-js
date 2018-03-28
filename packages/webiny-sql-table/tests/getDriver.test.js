import { assert } from "chai";
import UserTable from "./tables/user.table";
import CustomDriver from "./tables/customDriver";

describe("getDriver test", function() {
    it("should return instance of Driver", async () => {
        const user = new UserTable();
        assert.instanceOf(user.getDriver(), CustomDriver);
    });

    it("should return instance of Driver (static getDriver call)", async () => {
        assert.instanceOf(UserTable.getDriver(), CustomDriver);
    });
});
