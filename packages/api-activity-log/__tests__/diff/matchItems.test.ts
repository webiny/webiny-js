import { describe, expect, it } from "vitest";
import { longestIncreasingSubsequence, matchItems } from "~/core/diff/matchItems.js";

const item = (id: string, values: Record<string, unknown> = {}) => ({ _id: id, ...values });

const pairsOf = (matching: ReturnType<typeof matchItems>) =>
    matching.pairs.map(
        pair => `${pair.beforeIndex}->${pair.afterIndex}${pair.inOrder ? "" : " moved"}`
    );

describe("longestIncreasingSubsequence", () => {
    it("is empty for no values", () => {
        expect(longestIncreasingSubsequence([])).toEqual(new Set());
    });

    it("keeps a single value", () => {
        expect(longestIncreasingSubsequence([7])).toEqual(new Set([0]));
    });

    it("keeps everything when already ordered", () => {
        expect(longestIncreasingSubsequence([0, 1, 2, 3])).toEqual(new Set([0, 1, 2, 3]));
    });

    it("drops the one value that broke the order", () => {
        // [2,0,1] — the run 0,1 is longer than the run 2, so position 0 is the odd one out.
        expect(longestIncreasingSubsequence([2, 0, 1])).toEqual(new Set([1, 2]));
    });

    it("keeps the longest run when a value moved to the end", () => {
        expect(longestIncreasingSubsequence([1, 2, 0])).toEqual(new Set([0, 1]));
    });

    it("keeps one position for a fully reversed sequence", () => {
        expect(longestIncreasingSubsequence([3, 2, 1, 0]).size).toBe(1);
    });

    it("requires a strict increase", () => {
        expect(longestIncreasingSubsequence([1, 1, 1]).size).toBe(1);
    });
});

describe("matchItems", () => {
    describe("pass 1 — stable id", () => {
        it("pairs items sharing an id", () => {
            const matching = matchItems([item("a"), item("b")], [item("a"), item("b")]);

            expect(pairsOf(matching)).toEqual(["0->0", "1->1"]);
            expect(matching.added).toEqual([]);
            expect(matching.removed).toEqual([]);
        });

        it("pairs across a reorder and flags the displaced item", () => {
            const matching = matchItems(
                [item("a"), item("b"), item("c")],
                [item("c"), item("a"), item("b")]
            );

            expect(pairsOf(matching)).toEqual(["2->0 moved", "0->1", "1->2"]);
        });

        it("does not reuse one before-item for two identical ids", () => {
            // Ids are unique only within a single array, and duplicating a block copies its
            // nested ids verbatim, so a repeated id has to be tolerated rather than trusted.
            const matching = matchItems([item("dup")], [item("dup"), item("dup")]);

            expect(matching.pairs).toHaveLength(1);
            expect(matching.added).toEqual([1]);
        });
    });

    describe("pass 2 — content hash", () => {
        it("pairs a rewritten id whose content survived", () => {
            const matching = matchItems([item("a", { t: "1" })], [item("x", { t: "1" })]);

            expect(pairsOf(matching)).toEqual(["0->0"]);
        });

        it("pairs id-less items with their newly identified counterparts", () => {
            const matching = matchItems(
                [{ t: "1" }, { t: "2" }],
                [item("a", { t: "1" }), item("b", { t: "2" })]
            );

            expect(pairsOf(matching)).toEqual(["0->0", "1->1"]);
        });

        it("ignores nested ids when comparing content", () => {
            const before = [{ _id: "a", child: { _id: "c1", t: "x" } }];
            const after = [{ _id: "z", child: { _id: "c2", t: "x" } }];

            expect(pairsOf(matchItems(before, after))).toEqual(["0->0"]);
        });

        it("does not pair on content when the template differs", () => {
            const before = [{ _id: "a", _templateId: "hero", t: "x" }];
            const after = [{ _id: "z", _templateId: "text", t: "x" }];

            expect(matchItems(before, after).pairs).toHaveLength(0);
        });
    });

    describe("pass 3 — positional zip", () => {
        it("pairs id-less items that changed", () => {
            const matching = matchItems([{ t: "1" }], [{ t: "2" }]);

            expect(pairsOf(matching)).toEqual(["0->0"]);
        });

        it("refuses to pair when both sides carry ids", () => {
            const matching = matchItems([item("a", { t: "1" })], [item("z", { t: "2" })]);

            expect(matching.pairs).toHaveLength(0);
            expect(matching.added).toEqual([0]);
            expect(matching.removed).toEqual([0]);
        });

        it("pairs when only one side carries an id", () => {
            const matching = matchItems([{ t: "1" }], [item("z", { t: "2" })]);

            expect(pairsOf(matching)).toEqual(["0->0"]);
        });

        it("does not pair non-containers", () => {
            expect(matchItems([null], [{ t: "1" }]).pairs).toHaveLength(0);
        });
    });

    describe("additions and removals", () => {
        it("reports a leftover after-item as added", () => {
            const matching = matchItems([item("a")], [item("a"), item("b")]);

            expect(matching.added).toEqual([1]);
        });

        it("reports a leftover before-item as removed", () => {
            const matching = matchItems([item("a"), item("b")], [item("a")]);

            expect(matching.removed).toEqual([1]);
        });

        it("handles both lists being empty", () => {
            const matching = matchItems([], []);

            expect(matching).toEqual({ pairs: [], added: [], removed: [] });
        });

        it("reports every item as added when the before list is empty", () => {
            expect(matchItems([], [item("a"), item("b")]).added).toEqual([0, 1]);
        });

        it("reports every item as removed when the after list is empty", () => {
            expect(matchItems([item("a"), item("b")], []).removed).toEqual([0, 1]);
        });
    });

    describe("insertion does not cascade", () => {
        it("flags no moves when one item is inserted in the middle", () => {
            const matching = matchItems(
                [item("a"), item("b"), item("c")],
                [item("a"), item("n"), item("b"), item("c")]
            );

            expect(matching.pairs.every(pair => pair.inOrder)).toBe(true);
            expect(matching.added).toEqual([1]);
        });

        it("flags no moves when one item is removed from the middle", () => {
            const matching = matchItems([item("a"), item("b"), item("c")], [item("a"), item("c")]);

            expect(matching.pairs.every(pair => pair.inOrder)).toBe(true);
            expect(matching.removed).toEqual([1]);
        });
    });
});
