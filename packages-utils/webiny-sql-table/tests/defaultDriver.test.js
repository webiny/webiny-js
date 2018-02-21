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

    it("default database methods should return empty results", async () => {
        const driver = new Driver();
        assert.isNull(driver.create());
        assert.isNull(driver.update());
        assert.isNull(driver.exists());
        assert.isNull(driver.sync());
        assert.isNull(driver.delete());
        assert.isNull(driver.empty());
    });
});
