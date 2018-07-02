import { Index, IndexesContainer } from "webiny-sql-table";

describe("default Index test", () => {
    test("getIndexesClass should return default class", async () => {
        const index = new Index("Index", new IndexesContainer(), ["indexedFields"]);
        expect(index.getType()).toEqual("");
    });

    test("getParentIndexesContainer should return default class", async () => {
        const index = new Index("Index", new IndexesContainer(), ["indexedFields"]);
        expect(index.getParentIndexesContainer()).toBeInstanceOf(IndexesContainer);
    });

    test("getParentTable should return default class", async () => {
        const index = new Index("Index", new IndexesContainer(), ["indexedFields"]);
        expect(index.getParentTable()).not.toBeDefined();
    });

    test("columns must be defined, otherwise an Error must be thrown", async () => {
        try {
            new Index("Index", new IndexesContainer());
        } catch (e) {
            return;
        }
        throw Error(`Error should've been thrown.`);
    });
});
