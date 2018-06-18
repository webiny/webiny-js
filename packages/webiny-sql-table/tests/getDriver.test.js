import UserTable from "./tables/user.table";
import CustomDriver from "./tables/customDriver";

describe("getDriver test", () => {
    test("should return instance of Driver", async () => {
        const user = new UserTable();
        expect(user.getDriver()).toBeInstanceOf(CustomDriver);
    });

    test("should return instance of Driver (static getDriver call)", async () => {
        expect(UserTable.getDriver()).toBeInstanceOf(CustomDriver);
    });
});
