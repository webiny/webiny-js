import { Table } from "./..";

const table = new Table();

describe("default Table test", () => {
    test("getComment should return null by default", async () => {
        expect(table.getComment()).toEqual(null);
    });

    test("getAutoIncrement should return null by default", async () => {
        expect(table.getAutoIncrement()).toEqual(null);
    });

    test("default database methods should return empty results", async () => {
        expect(await table.create()).toBeNull();
        expect(await table.alter()).toBeNull();

        expect(await table.drop()).toBeNull();
        expect(await table.truncate()).toBeNull();
    });
});
