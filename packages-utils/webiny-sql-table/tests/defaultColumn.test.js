import { assert } from "chai";
import { Column, ColumnsContainer } from "./..";

describe("default Column test", function() {
    it("getColumnsClass should return default class", async () => {
        const column = new Column();
        assert.equal(column.getType(), "");
    });

    it("getParentColumnsContainer should return default class", async () => {
        const column = new Column("Column", new ColumnsContainer());
        assert.instanceOf(column.getParentColumnsContainer(), ColumnsContainer);
    });

    it("getParentTable should return default class", async () => {
        const column = new Column("Column", new ColumnsContainer());
        assert.isUndefined(column.getParentTable());
    });
});
