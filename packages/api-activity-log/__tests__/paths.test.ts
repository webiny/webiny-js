import { describe, expect, it } from "vitest";
import {
    commonParentPath,
    encodePath,
    fieldSegment,
    indexSegment,
    itemSegment,
    listItemSegment,
    splitPathSegments
} from "~/core/paths.js";

describe("path encoding", () => {
    describe("encodePath", () => {
        it("joins field segments with dots", () => {
            expect(encodePath([fieldSegment("author"), fieldSegment("name")])).toBe("author.name");
        });

        it("attaches an item segment without a separator", () => {
            expect(encodePath([fieldSegment("sections"), itemSegment("aaaaaaaaaaaa")])).toBe(
                "sections#aaaaaaaaaaaa"
            );
        });

        it("attaches an index segment without a separator", () => {
            expect(encodePath([fieldSegment("tags"), indexSegment(2)])).toBe("tags[2]");
        });

        it("encodes a deep mixed path", () => {
            const path = encodePath([
                fieldSegment("sections"),
                itemSegment("aaaaaaaaaaaa"),
                fieldSegment("blocks"),
                indexSegment(1),
                fieldSegment("title")
            ]);

            expect(path).toBe("sections#aaaaaaaaaaaa.blocks[1].title");
        });

        it("rejects a segment carrying a separator character", () => {
            expect(() => encodePath([fieldSegment("a.b")])).toThrow(/separator character/);
            expect(() => encodePath([itemSegment("a#b")])).toThrow(/separator character/);
        });
    });

    describe("listItemSegment", () => {
        it("prefers a stable id when the item carries one", () => {
            const segment = listItemSegment({ _id: "aaaaaaaaaaaa", title: "x" }, 4);

            expect(segment).toEqual({ kind: "item", id: "aaaaaaaaaaaa" });
        });

        it("falls back to the position when the item has no id", () => {
            // Every entry written before stable ids landed is in this state until its next save,
            // so this is a permanent branch rather than a transitional one.
            expect(listItemSegment({ title: "x" }, 4)).toEqual({ kind: "index", index: 4 });
        });

        it("falls back to the position for an empty id", () => {
            expect(listItemSegment({ _id: "" }, 1)).toEqual({ kind: "index", index: 1 });
        });

        it("falls back to the position for a non-string id", () => {
            expect(listItemSegment({ _id: 7 }, 1)).toEqual({ kind: "index", index: 1 });
        });

        it("falls back to the position for scalars and null", () => {
            expect(listItemSegment("plain", 3)).toEqual({ kind: "index", index: 3 });
            expect(listItemSegment(null, 0)).toEqual({ kind: "index", index: 0 });
        });

        it("distinguishes an identified item from a positional one at the same slot", () => {
            const identified = encodePath([
                fieldSegment("sections"),
                listItemSegment({ _id: "aaaaaaaaaaaa" }, 0)
            ]);
            const positional = encodePath([fieldSegment("sections"), listItemSegment({}, 0)]);

            expect(identified).not.toBe(positional);
        });
    });

    describe("splitPathSegments", () => {
        it("round-trips a deep mixed path", () => {
            expect(splitPathSegments("sections#aaaaaaaaaaaa.blocks[1].title")).toEqual([
                "sections",
                "#aaaaaaaaaaaa",
                "blocks",
                "[1]",
                "title"
            ]);
        });

        it("returns nothing for an empty path", () => {
            expect(splitPathSegments("")).toEqual([]);
        });
    });

    describe("commonParentPath", () => {
        it("returns the path itself for a single path", () => {
            expect(commonParentPath(["a.b.c"])).toBe("a.b.c");
        });

        it("finds the shared parent of sibling fields", () => {
            expect(commonParentPath(["author.name", "author.email"])).toBe("author");
        });

        it("finds the shared parent inside an identified item", () => {
            const paths = [
                "sections#aaaaaaaaaaaa.blocks[0].title",
                "sections#aaaaaaaaaaaa.blocks[1].title"
            ];

            expect(commonParentPath(paths)).toBe("sections#aaaaaaaaaaaa.blocks");
        });

        it("stops at the item boundary when items differ", () => {
            const paths = ["sections#aaaaaaaaaaaa.title", "sections#bbbbbbbbbbbb.title"];

            expect(commonParentPath(paths)).toBe("sections");
        });

        it("returns the whole target when paths share no prefix", () => {
            expect(commonParentPath(["title", "body"])).toBe("");
        });

        it("returns the whole target for no paths at all", () => {
            expect(commonParentPath([])).toBe("");
        });

        it("does not treat a prefix of a field name as a shared segment", () => {
            // "authorName" and "author" share a string prefix but no path segment.
            expect(commonParentPath(["authorName.x", "author.x"])).toBe("");
        });
    });
});
