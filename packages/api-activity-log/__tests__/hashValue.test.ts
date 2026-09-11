import { describe, expect, it } from "vitest";
import { hashValue } from "~/core/hashing/hashValue.js";

/**
 * These hashes are internal to the differ — they are never persisted on a record. What matters is
 * that two value trees hashed within one save agree exactly when they mean the same thing, since
 * that is what licenses skipping a subtree and what recognises an item that reappeared under a
 * new id.
 */
describe("hashValue", () => {
    describe("determinism", () => {
        it("hashes the same value to the same digest", () => {
            expect(hashValue("hello")).toBe(hashValue("hello"));
        });

        it("ignores key order", () => {
            expect(hashValue({ b: 2, a: 1 })).toBe(hashValue({ a: 1, b: 2 }));
        });

        it("ignores nested key order", () => {
            expect(hashValue({ outer: { y: 2, x: 1 }, top: "v" })).toBe(
                hashValue({ top: "v", outer: { x: 1, y: 2 } })
            );
        });

        it("hashes a deeply nested value stably", () => {
            const build = () => ({
                sections: [{ _id: "cccccccccccc", blocks: [{ body: "x", count: 2 }] }]
            });

            expect(hashValue(build())).toBe(hashValue(build()));
        });
    });

    describe("normalisation carries through to the digest", () => {
        it("agrees across undefined, null and empty string", () => {
            const expected = hashValue(null);

            expect(hashValue(undefined)).toBe(expected);
            expect(hashValue("")).toBe(expected);
        });

        it("agrees between a cleared field and an absent field", () => {
            // Otherwise every save that routes through a different write path would report a
            // change that did not happen.
            expect(hashValue({ a: "kept", b: "" })).toBe(hashValue({ a: "kept" }));
        });

        it("agrees across number spellings", () => {
            expect(hashValue(1)).toBe(hashValue(1.0));
            expect(hashValue(-0)).toBe(hashValue(0));
        });

        it("agrees for equal dates held in different instances", () => {
            const iso = "2026-09-10T08:30:00.000Z";

            expect(hashValue(new Date(iso))).toBe(hashValue(new Date(iso)));
        });
    });

    describe("discrimination", () => {
        it("separates different values", () => {
            expect(hashValue("a")).not.toBe(hashValue("b"));
        });

        it("separates a numeric string from a number", () => {
            expect(hashValue("1")).not.toBe(hashValue(1));
        });

        it("separates a boolean from its string spelling", () => {
            expect(hashValue(true)).not.toBe(hashValue("true"));
        });

        it("separates reordered lists", () => {
            expect(hashValue(["a", "b"])).not.toBe(hashValue(["b", "a"]));
        });

        it("separates an empty array from an empty object", () => {
            expect(hashValue([])).not.toBe(hashValue({}));
        });

        it("separates a nested change deep in a subtree", () => {
            // The differ relies on this to avoid skipping a subtree that did change.
            const one = { s: [{ _id: "a", blocks: [{ body: "x" }] }] };
            const other = { s: [{ _id: "a", blocks: [{ body: "y" }] }] };

            expect(hashValue(one)).not.toBe(hashValue(other));
        });
    });

    describe("digest shape", () => {
        it("is 32 lowercase hex characters", () => {
            expect(hashValue("anything")).toMatch(/^[0-9a-f]{32}$/);
        });
    });
});
