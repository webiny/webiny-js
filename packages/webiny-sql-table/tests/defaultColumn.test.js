import { Column, ColumnsContainer } from "webiny-sql-table";

const column = new Column("Column", new ColumnsContainer());

describe("default Column test", () => {
    test("getColumnsClass should return default class", async () => {
        expect(column.getType()).toEqual("");
    });

    test("getParentColumnsContainer should return default class", async () => {
        expect(column.getParentColumnsContainer()).toBeInstanceOf(ColumnsContainer);
    });

    test("getParentTable should return default class", async () => {
        expect(column.getParentTable()).not.toBeDefined();
    });

    test("getArguments by default should return an empty array", async () => {
        expect(column.getArguments()).toHaveLength(0);
    });
});
