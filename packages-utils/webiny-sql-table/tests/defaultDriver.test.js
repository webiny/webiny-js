import { assert } from "chai";
import { Driver, ColumnsContainer, IndexesContainer } from "./..";

describe("default Driver test", function() {
    it("getColumnsClass should return default class", async () => {
        const driver = new Driver();

        const columnsClass = new (driver.getColumnsClass())();
        assert.instanceOf(columnsClass, ColumnsContainer);
    });

    it("getIndexesClass should return default class", async () => {
        const driver = new Driver();

        const indexesClass = new (driver.getIndexesClass())();
        assert.instanceOf(indexesClass, IndexesContainer);
    });

    it("default database methods should return empty results", async () => {
        const driver = new Driver();
        assert.equal(await driver.create(), "");
        assert.equal(await driver.alter(), "");
        assert.equal(await driver.drop(), "");
        assert.equal(await driver.truncate(), "");
    });
});
