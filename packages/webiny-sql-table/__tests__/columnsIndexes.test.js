import UserTable from "./tables/user.table";
import { IntColumn, CharColumn } from "./tables/customDriver/columns";
import { PrimaryIndex, UniqueIndex } from "./tables/customDriver/indexes";

describe("columns and indexes test", () => {
    test("should return columns and its properties correctly", async () => {
        const user = new UserTable();
        expect(user.getColumn("id")).toBeInstanceOf(IntColumn);
        expect(user.getColumn("id").getUnsigned()).toBe(true);
        expect(user.getColumn("id").getAutoIncrement()).toBe(true);

        expect(user.getColumn("total").getUnsigned()).toBe(false);
        user.getColumn("total").setAutoIncrement(false);
        expect(user.getColumn("total").getAutoIncrement()).toBe(false);

        expect(user.getColumn("totalViews").getUnsigned()).toBe(true);
        user.getColumn("totalViews").setUnsigned(true);
        expect(user.getColumn("totalViews").getUnsigned()).toBe(true);

        expect(user.getColumn("name")).toBeInstanceOf(CharColumn);
    });

    test("should return undefined because of an invalid column name", async () => {
        const user = new UserTable();
        expect(user.getColumn("id123")).not.toBeDefined();
    });

    test("should return all columns", async () => {
        const user = new UserTable();
        expect(Object.keys(user.getColumns()).length).toBe(4);
    });

    test("should return indexes correctly", async () => {
        const user = new UserTable();
        expect(user.getIndex("id")).toBeInstanceOf(PrimaryIndex);
        expect(user.getIndex("name")).toBeInstanceOf(UniqueIndex);
    });

    test("should return undefined because of an invalid index name", async () => {
        const user = new UserTable();
        expect(user.getIndex("id123")).not.toBeDefined();
    });

    test("should return all indexes", async () => {
        const user = new UserTable();
        expect(user.getIndexes().length).toBe(4);
    });
});
