import { assert } from "chai";
import { Table } from "./..";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

const table = new Table();

describe("default Table test", function() {
    it("getComment should return null by default", async () => {
        assert.equal(table.getComment(), null);
    });

    it("getAutoIncrement should return null by default", async () => {
        assert.equal(table.getAutoIncrement(), null);
    });

    it("default database methods should return empty results", async () => {
        assert.isNull(await table.create());
        assert.isNull(await table.update());
        assert.isNull(await table.exists());
        assert.isNull(await table.sync());

        const existsStub = sandbox.stub(table, "exists").callsFake(() => true);
        assert.isNull(await table.sync());
        existsStub.restore();

        assert.isNull(await table.delete());
        assert.isNull(await table.empty());
    });
});
