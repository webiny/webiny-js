import { describe, expect, it } from "vitest";
import { contentHash, stripIds } from "~/core/diff/contentHash.js";

describe("stripIds", () => {
    it("removes a top-level _id", () => {
        expect(stripIds({ _id: "aaa", title: "x" })).toEqual({ title: "x" });
    });

    it("removes _id at every depth", () => {
        const value = {
            _id: "a",
            child: { _id: "b", items: [{ _id: "c", t: "x" }] }
        };

        expect(stripIds(value)).toEqual({ child: { items: [{ t: "x" }] } });
    });

    it("keeps _templateId, since swapping a template is a real change", () => {
        expect(stripIds({ _id: "a", _templateId: "hero" })).toEqual({ _templateId: "hero" });
    });

    it("preserves array order and length", () => {
        expect(stripIds([{ _id: "a" }, { _id: "b", t: 1 }])).toEqual([{}, { t: 1 }]);
    });

    it("leaves a Date intact rather than recursing into it", () => {
        // A Date is an object but not a container. Recursing would flatten it to {} and make
        // every date look equal to every other date.
        const date = new Date("2026-09-10T08:30:00.000Z");
        const result = stripIds({ _id: "a", when: date }) as { when: Date };

        expect(result.when).toBeInstanceOf(Date);
        expect(result.when.getTime()).toBe(date.getTime());
    });

    it("passes scalars through", () => {
        expect(stripIds("text")).toBe("text");
        expect(stripIds(7)).toBe(7);
        expect(stripIds(null)).toBe(null);
        expect(stripIds(undefined)).toBe(undefined);
    });
});

describe("contentHash", () => {
    it("ignores identity", () => {
        expect(contentHash({ _id: "aaa", t: "x" })).toBe(contentHash({ _id: "zzz", t: "x" }));
    });

    it("ignores identity at depth", () => {
        const one = { _id: "a", items: [{ _id: "c1", t: "x" }] };
        const other = { _id: "z", items: [{ _id: "c2", t: "x" }] };

        expect(contentHash(one)).toBe(contentHash(other));
    });

    it("still separates different content", () => {
        expect(contentHash({ _id: "a", t: "x" })).not.toBe(contentHash({ _id: "a", t: "y" }));
    });

    it("separates different templates", () => {
        expect(contentHash({ _templateId: "hero" })).not.toBe(contentHash({ _templateId: "text" }));
    });

    it("distinguishes two dates", () => {
        expect(contentHash(new Date("2026-01-01T00:00:00.000Z"))).not.toBe(
            contentHash(new Date("2026-01-02T00:00:00.000Z"))
        );
    });
});
