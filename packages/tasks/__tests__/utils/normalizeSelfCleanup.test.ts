import { describe, it, expect } from "vitest";
import { normalizeSelfCleanup } from "~/utils/normalizeSelfCleanup.js";

describe("normalizeSelfCleanup", () => {
    it("returns empty set when input is undefined", () => {
        expect(normalizeSelfCleanup(undefined).size).toBe(0);
    });

    it("returns empty set when input is 'never'", () => {
        expect(normalizeSelfCleanup("never").size).toBe(0);
    });

    it("expands 'always' to all three events", () => {
        const set = normalizeSelfCleanup("always");
        expect(set.has("onSuccess")).toBe(true);
        expect(set.has("onError")).toBe(true);
        expect(set.has("onAbort")).toBe(true);
        expect(set.size).toBe(3);
    });

    it("accepts a single event", () => {
        const set = normalizeSelfCleanup("onSuccess");
        expect(set.has("onSuccess")).toBe(true);
        expect(set.size).toBe(1);
    });

    it("accepts an array", () => {
        const set = normalizeSelfCleanup(["onSuccess", "onError"]);
        expect(set.has("onSuccess")).toBe(true);
        expect(set.has("onError")).toBe(true);
        expect(set.has("onAbort")).toBe(false);
        expect(set.size).toBe(2);
    });

    it("collapses duplicates in an array", () => {
        const set = normalizeSelfCleanup(["onSuccess", "onSuccess", "onError"]);
        expect(set.size).toBe(2);
    });
});
