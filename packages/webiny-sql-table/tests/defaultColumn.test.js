import { assert } from "chai";
import { Column, ColumnsContainer } from "./..";

const column = new Column("Column", new ColumnsContainer());

describe("default Column test", function() {
    it("getColumnsClass should return default class", async () => {
        assert.equal(column.getType(), "");
    });

    it("getParentColumnsContainer should return default class", async () => {
        assert.instanceOf(column.getParentColumnsContainer(), ColumnsContainer);
    });

    it("getParentTable should return default class", async () => {
        assert.isUndefined(column.getParentTable());
    });

    it("getArguments by default should return an empty array", async () => {
        assert.empty(column.getArguments());
    });
});
