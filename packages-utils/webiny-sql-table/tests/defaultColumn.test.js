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

    it("setDefault / getDefault should return null", async () => {
        const column = new Column();
        assert.isNull(column.getDefault());
        column.setDefault("Test");
        assert.equal(column.getDefault(), "Test");
    });

    it("setAllowNull / getAllowNull should return null", async () => {
        const column = new Column();
        assert.isTrue(column.getAllowNull());
        column.setAllowNull(false);
        assert.isFalse(column.getAllowNull());
        column.setAllowNull();
        assert.isTrue(column.getAllowNull());
    });
});
