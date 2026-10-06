import { describe, expect, it } from "vitest";
import { latestReviews, parseReview, type ReviewLogEntry } from "./review.js";

describe("parseReview", () => {
    it("accepts a verdict alone", () => {
        expect(parseReview({ verdict: "migrated" })).toEqual({
            verdict: "migrated",
            reasons: [],
            note: null
        });
    });

    it("keeps reasons in the closed list's order, once each, and trims the note", () => {
        expect(
            parseReview({
                verdict: "needs-polish",
                reasons: ["typography-wrong", "wrong-height", "typography-wrong"],
                note: "  heading too small  "
            })
        ).toEqual({
            verdict: "needs-polish",
            reasons: ["wrong-height", "typography-wrong"],
            note: "heading too small"
        });
    });

    it("refuses a verdict or reason outside the closed lists", () => {
        expect(parseReview({ verdict: "major rework" })).toMatch(/Unknown verdict/);
        expect(parseReview({ verdict: "needs-polish", reasons: ["ugly"] })).toMatch(
            /Unknown reason/
        );
    });
});

describe("latestReviews", () => {
    const entry = (signature: string, createdOn: string, verdict: string, hash: string) =>
        ({
            signature,
            createdOn,
            createdBy: { id: "u1", displayName: "Reviewer" },
            machineValue: { contentSha256: hash, revision: 1 },
            humanValue: { verdict, reasons: [], note: null }
        }) as ReviewLogEntry;

    it("takes each component's latest review", () => {
        const reviews = latestReviews(
            [
                entry("a", "2026-10-07T10:00:00Z", "needs-polish", "h1"),
                entry("a", "2026-10-07T11:00:00Z", "migrated", "h1")
            ],
            () => "h1"
        );
        expect(reviews.a.verdict).toBe("migrated");
        expect(reviews.a.current).toBe(true);
    });

    it("marks a review given on an earlier output as not current", () => {
        const reviews = latestReviews(
            [entry("a", "2026-10-07T10:00:00Z", "migrated", "old")],
            () => "new"
        );
        expect(reviews.a.current).toBe(false);
    });

    it("ignores log entries that are not reviews", () => {
        const reviews = latestReviews(
            [
                {
                    signature: "a",
                    createdOn: "2026-10-07T10:00:00Z",
                    createdBy: null,
                    machineValue: null,
                    humanValue: { decision: "accepted" }
                }
            ],
            () => "h1"
        );
        expect(reviews).toEqual({});
    });
});
