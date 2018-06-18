import { Driver, ColumnsContainer, IndexesContainer } from "./..";

describe("default Driver test", () => {
    test("getColumnsClass should return default class", async () => {
        const driver = new Driver();

        const columnsClass = new (driver.getColumnsClass())();
        expect(columnsClass).toBeInstanceOf(ColumnsContainer);
    });

    test("getIndexesClass should return default class", async () => {
        const driver = new Driver();

        const indexesClass = new (driver.getIndexesClass())();
        expect(indexesClass).toBeInstanceOf(IndexesContainer);
    });

    test("default database methods should return empty results", async () => {
        const driver = new Driver();
        expect(await driver.create()).toEqual("");
        expect(await driver.alter()).toEqual("");
        expect(await driver.drop()).toEqual("");
        expect(await driver.truncate()).toEqual("");
        expect(await driver.sync()).toEqual("");
    });
});
