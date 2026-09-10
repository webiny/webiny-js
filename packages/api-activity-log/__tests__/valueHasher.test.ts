import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { ActivityValueHasher } from "~/core/hashing/abstractions.js";
import { HashingFeature } from "~/core/hashing/feature.js";
import type { ActivityTarget } from "~/core/types.js";

const entry = (id: string): ActivityTarget => ({ type: "cms-entry", id });

const targetA = entry("aaaaaaaaaaaa");
const targetB = entry("bbbbbbbbbbbb");

describe("ValueHasher", () => {
    let hasher: ActivityValueHasher.Interface;

    beforeEach(() => {
        const container = new Container();
        HashingFeature.register(container);
        hasher = container.resolve(ActivityValueHasher);
    });

    describe("determinism", () => {
        it("hashes the same value to the same digest", () => {
            expect(hasher.hash("hello", targetA)).toBe(hasher.hash("hello", targetA));
        });

        it("hashes an equal object to the same digest regardless of key order", () => {
            const one = { b: 2, a: 1 };
            const other = { a: 1, b: 2 };

            expect(hasher.hash(one, targetA)).toBe(hasher.hash(other, targetA));
        });

        it("hashes a deeply nested value stably", () => {
            const build = () => ({
                sections: [{ _id: "cccccccccccc", blocks: [{ body: "x" }] }]
            });

            expect(hasher.hash(build(), targetA)).toBe(hasher.hash(build(), targetA));
        });
    });

    describe("normalisation carries through to the digest", () => {
        it("agrees across undefined, null and empty string", () => {
            const expected = hasher.hash(null, targetA);

            expect(hasher.hash(undefined, targetA)).toBe(expected);
            expect(hasher.hash("", targetA)).toBe(expected);
        });

        it("agrees between a cleared field and an absent field", () => {
            expect(hasher.hash({ a: "kept", b: "" }, targetA)).toBe(
                hasher.hash({ a: "kept" }, targetA)
            );
        });

        it("agrees across number spellings", () => {
            expect(hasher.hash(1, targetA)).toBe(hasher.hash(1.0, targetA));
            expect(hasher.hash(-0, targetA)).toBe(hasher.hash(0, targetA));
        });
    });

    describe("discrimination", () => {
        it("separates different values", () => {
            expect(hasher.hash("a", targetA)).not.toBe(hasher.hash("b", targetA));
        });

        it("separates a numeric string from a number", () => {
            expect(hasher.hash("1", targetA)).not.toBe(hasher.hash(1, targetA));
        });

        it("separates reordered lists", () => {
            expect(hasher.hash(["a", "b"], targetA)).not.toBe(hasher.hash(["b", "a"], targetA));
        });
    });

    describe("per-target salting", () => {
        it("gives the same value different digests on different targets", () => {
            // This is what stops the log being used to discover that two entries hold the same
            // value.
            expect(hasher.hash("shared", targetA)).not.toBe(hasher.hash("shared", targetB));
        });

        it("separates targets of the same id but a different type", () => {
            const sameId = { type: "cms-entry", id: "aaaaaaaaaaaa" } as ActivityTarget;
            const other = { type: "wb-page", id: "aaaaaaaaaaaa" } as unknown as ActivityTarget;

            expect(hasher.hash("shared", sameId)).not.toBe(hasher.hash("shared", other));
        });

        it("keeps the salt and the value separated", () => {
            // Guards the boundary between the two digest inputs. Type tags in the canonical form
            // make a collision hard to construct today, so this is a regression test for the
            // separator rather than a demonstration that it is load-bearing right now.
            const first = hasher.hash("x", entry("ab"));
            const second = hasher.hash("bx", entry("a"));

            expect(first).not.toBe(second);
        });
    });

    describe("digest shape", () => {
        it("is 32 lowercase hex characters", () => {
            expect(hasher.hash("anything", targetA)).toMatch(/^[0-9a-f]{32}$/);
        });
    });
});
