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

    it("getConnection should return null", async () => {
        const driver = new Driver();
        assert.isNull(driver.getConnection());
    });

    it("sync should return null", async () => {
        const driver = new Driver();
        assert.isNull(await driver.sync());
    });
});
