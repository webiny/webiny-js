import { assert } from "chai";
import { Table } from "./..";

const table = new Table();

describe("default Table test", function() {
    it("getComment should return null by default", async () => {
        assert.equal(table.getComment(), "");
    });

    it("getAutoIncrement should return null by default", async () => {
        assert.equal(table.getAutoIncrement(), 0);
    });

    it("default database methods should return empty results", async () => {
        assert.isNull(await table.create());
        assert.isNull(await table.alter());

        assert.isNull(await table.drop());
        assert.isNull(await table.truncate());
    });
});
