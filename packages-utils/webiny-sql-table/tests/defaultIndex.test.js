import { assert } from "chai";
import { Index, IndexesContainer } from "./..";

describe("default Index test", function() {
    it("getIndexesClass should return default class", async () => {
        const index = new Index();
        assert.equal(index.getType(), "");
    });

    it("getParentIndexesContainer should return default class", async () => {
        const index = new Index("Index", new IndexesContainer());
        assert.instanceOf(index.getParentIndexesContainer(), IndexesContainer);
    });

    it("getParentTable should return default class", async () => {
        const index = new Index("Index", new IndexesContainer());
        assert.isUndefined(index.getParentTable());
    });
});
