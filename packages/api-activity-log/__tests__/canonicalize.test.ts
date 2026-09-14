import { describe, expect, it } from "vitest";
import { canonicalize } from "~/core/hashing/canonicalize.js";

describe("canonicalize", () => {
    describe("absent-equivalent values collapse", () => {
        it("treats undefined, null and empty string as one value", () => {
            const expected = canonicalize(null);

            expect(canonicalize(undefined)).toBe(expected);
            expect(canonicalize("")).toBe(expected);
        });

        it("drops object keys whose value is absent-equivalent", () => {
            const empty = canonicalize({});

            expect(canonicalize({ title: "" })).toBe(empty);
            expect(canonicalize({ title: null })).toBe(empty);
            expect(canonicalize({ title: undefined })).toBe(empty);
        });

        it("agrees between a cleared field and a missing field", () => {
            // The admin form sends "", a GraphQL write sends null, and a shallow merge can drop
            // the key altogether. None of the three is a content change.
            expect(canonicalize({ a: "kept", b: "" })).toBe(canonicalize({ a: "kept" }));
        });

        it("keeps absent-equivalent items in an array, because removing one shifts every index", () => {
            expect(canonicalize(["a", null, "b"])).not.toBe(canonicalize(["a", "b"]));
        });
    });

    describe("key order", () => {
        it("does not depend on insertion order", () => {
            const one = { alpha: 1, beta: 2, gamma: 3 };
            const other = { gamma: 3, alpha: 1, beta: 2 };

            expect(canonicalize(one)).toBe(canonicalize(other));
        });

        it("does not depend on nested insertion order", () => {
            const one = { outer: { x: true, y: false }, top: "v" };
            const other = { top: "v", outer: { y: false, x: true } };

            expect(canonicalize(one)).toBe(canonicalize(other));
        });
    });

    describe("numbers", () => {
        it("gives an integer and its float spelling the same form", () => {
            expect(canonicalize(1)).toBe(canonicalize(1.0));
        });

        it("normalises negative zero", () => {
            expect(canonicalize(-0)).toBe(canonicalize(0));
        });

        it("treats non-finite numbers as absent, since they cannot round-trip through storage", () => {
            const absent = canonicalize(null);

            expect(canonicalize(Number.NaN)).toBe(absent);
            expect(canonicalize(Number.POSITIVE_INFINITY)).toBe(absent);
            expect(canonicalize(Number.NEGATIVE_INFINITY)).toBe(absent);
        });

        it("distinguishes genuinely different numbers", () => {
            expect(canonicalize(1)).not.toBe(canonicalize(2));
            expect(canonicalize(1.5)).not.toBe(canonicalize(1.05));
        });
    });

    describe("type tagging", () => {
        it("does not confuse a numeric string with a number", () => {
            expect(canonicalize("1")).not.toBe(canonicalize(1));
        });

        it("does not confuse a boolean with its string spelling", () => {
            expect(canonicalize(true)).not.toBe(canonicalize("true"));
        });

        it("does not confuse an empty array with an empty object", () => {
            expect(canonicalize([])).not.toBe(canonicalize({}));
        });

        it("does not let a crafted string impersonate a structure", () => {
            // Without escaping, a string containing the object delimiters could serialise to the
            // same form as a real object.
            expect(canonicalize({ a: 'o{"b":s"c"}' })).not.toBe(canonicalize({ a: { b: "c" } }));
        });
    });

    describe("arrays", () => {
        it("is order sensitive", () => {
            expect(canonicalize(["a", "b"])).not.toBe(canonicalize(["b", "a"]));
        });

        it("is stable for equal arrays", () => {
            expect(canonicalize([1, "two", true])).toBe(canonicalize([1, "two", true]));
        });
    });

    describe("dates", () => {
        it("does not depend on the Date instance", () => {
            const iso = "2026-09-10T08:30:00.000Z";

            expect(canonicalize(new Date(iso))).toBe(canonicalize(new Date(iso)));
        });

        it("distinguishes a Date from its ISO string", () => {
            const iso = "2026-09-10T08:30:00.000Z";

            expect(canonicalize(new Date(iso))).not.toBe(canonicalize(iso));
        });

        it("treats an invalid Date as absent", () => {
            expect(canonicalize(new Date("not a date"))).toBe(canonicalize(null));
        });
    });

    describe("determinism", () => {
        it("produces the same form for a deeply nested value every time", () => {
            const build = () => ({
                sections: [
                    {
                        _id: "aaaaaaaaaaaa",
                        title: "One",
                        blocks: [{ _id: "bbbbbbbbbbbb", body: "text", count: 3 }]
                    }
                ],
                published: false
            });

            expect(canonicalize(build())).toBe(canonicalize(build()));
        });
    });
});
