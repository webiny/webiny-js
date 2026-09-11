import { describe, expect, it } from "vitest";
import { writeSignature } from "~/timeline/writeSignature.js";

/**
 * The signal the timeline refreshes on. Every case here is an action the entry form can take that
 * produces a record — if one of them stopped changing the signature, saving would silently go back
 * to needing a page reload, which is the bug this exists to fix.
 */

const entry = {
    id: "abc#0002",
    savedOn: "2026-09-10T10:00:00.000Z",
    revisionSavedOn: "2026-09-10T10:00:00.000Z",
    revisionLastPublishedOn: null,
    meta: { status: "draft" }
};

describe("writeSignature", () => {
    it("is stable when nothing changed", () => {
        expect(writeSignature(entry)).toBe(writeSignature({ ...entry }));
    });

    it("changes on an ordinary save", () => {
        const saved = { ...entry, revisionSavedOn: "2026-09-10T10:05:00.000Z" };

        expect(writeSignature(saved)).not.toBe(writeSignature(entry));
    });

    it("changes when a save creates a new revision", () => {
        // Saving a locked revision creates the next one, so the revision id moves.
        const next = { ...entry, id: "abc#0003" };

        expect(writeSignature(next)).not.toBe(writeSignature(entry));
    });

    it("changes on publish", () => {
        const published = { ...entry, meta: { status: "published" } };

        expect(writeSignature(published)).not.toBe(writeSignature(entry));
    });

    it("changes on unpublish", () => {
        const published = { ...entry, meta: { status: "published" } };
        const unpublished = { ...entry, meta: { status: "unpublished" } };

        expect(writeSignature(unpublished)).not.toBe(writeSignature(published));
    });

    it("changes on republish, where the status does not move", () => {
        // The one case status alone would miss: already published, published again.
        const published = {
            ...entry,
            meta: { status: "published" },
            revisionLastPublishedOn: "2026-09-10T11:00:00.000Z"
        };
        const republished = { ...published, revisionLastPublishedOn: "2026-09-10T12:00:00.000Z" };

        expect(writeSignature(republished)).not.toBe(writeSignature(published));
    });

    it("is an empty string for no entry, rather than something that flickers", () => {
        expect(writeSignature(null)).toBe("");
        expect(writeSignature(undefined)).toBe("");
    });

    it("tolerates an entry with none of the meta fields present", () => {
        expect(() => writeSignature({ id: "abc#0001" })).not.toThrow();
        expect(writeSignature({ id: "abc#0001" })).not.toBe("");
    });
});
