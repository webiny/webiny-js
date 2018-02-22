import { assert } from "chai";
import { Index, IndexesContainer } from "./..";

describe("default Index test", function() {
    it("getIndexesClass should return default class", async () => {
        const index = new Index("Index", new IndexesContainer(), ["indexedFields"]);
        assert.equal(index.getType(), "");
    });

    it("getParentIndexesContainer should return default class", async () => {
        const index = new Index("Index", new IndexesContainer(), ["indexedFields"]);
        assert.instanceOf(index.getParentIndexesContainer(), IndexesContainer);
    });

    it("getParentTable should return default class", async () => {
        const index = new Index("Index", new IndexesContainer(), ["indexedFields"]);
        assert.isUndefined(index.getParentTable());
    });

    it("columns must be defined, otherwise an Error must be thrown", async () => {
        try {
            new Index("Index", new IndexesContainer());
        } catch (e) {
            return;
        }
        throw Error(`Error should've been thrown.`);
    });
});
