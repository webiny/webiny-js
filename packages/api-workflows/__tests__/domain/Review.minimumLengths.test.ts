import { describe, expect, it } from "vitest";
import { Review, type ReviewRequestParams } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import {
    ARTICLE_MODEL,
    createStartedReview,
    createWorkflow,
    expectOk,
    NOW,
    otherReviewer,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const requestParams = (requestedTitle?: string | null): ReviewRequestParams => {
    return {
        id: "review-1",
        workflow: createWorkflow(),
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        requestedTitle,
        targetContext,
        picks: [],
        requester,
        now: NOW
    };
};

const rejectAs = (actor: Actor, comment: string | null) => {
    return {
        stepId: "legal",
        actor,
        actorTeamIds: [REVIEW_TEAM_ID],
        comment,
        now: LATER
    };
};

describe("Review request title (D135, R89)", () => {
    it("uses the requested title, trimmed, and keeps the target's title in the context", () => {
        const review = expectOk(Review.request(requestParams("  Spring launch  ")));

        expect(review.toData().title).toBe("Spring launch");
        expect(review.toData().targetContext.title).toBe("Article 1");
    });

    it("falls back to the target's title when the title is missing, null or blank", () => {
        for (const requestedTitle of [undefined, null, "", "    "]) {
            const review = expectOk(Review.request(requestParams(requestedTitle)));

            expect(review.toData().title).toBe("Article 1");
        }
    });

    it("accepts a title of exactly 5 characters", () => {
        const review = expectOk(Review.request(requestParams(" Fixes ")));

        expect(review.toData().title).toBe("Fixes");
    });

    it("rejects a title shorter than 5 characters after trimming", () => {
        const result = Review.request(requestParams("  Abcd  "));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("The review title must have at least 5 characters.");
    });
});

describe("Review reject comment (D100, R90)", () => {
    it("refuses a missing, blank or short comment and changes nothing", () => {
        for (const comment of [null, "", "          ", "Too short", "  Too short  "]) {
            const review = createStartedReview();
            const before = review.toData();

            const result = review.reject(rejectAs(reviewer, comment));

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("Workflows/Review/Validation");
            expect(result.error.message).toBe(
                "A rejection needs a comment of at least 10 characters."
            );
            expect(review.toData()).toEqual(before);
            expect(review.pullFacts()).toEqual([]);
        }
    });

    it("accepts 10 characters after trimming and stores the trimmed comment", () => {
        const review = createStartedReview();

        expectOk(review.reject(rejectAs(reviewer, "  Not ready.  ")));

        expect(review.toData().steps[0]).toMatchObject({
            state: "rejected",
            comment: "Not ready."
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepRejected",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
                comment: "Not ready."
            }
        ]);
    });

    it("checks the owner before the comment", () => {
        const review = createStartedReview();

        const result = review.reject(rejectAs(otherReviewer, "No."));

        expect(result.error.code).toBe("Workflows/Review/NotOwner");
    });

    it("keeps the reject flag check free of the comment rule", () => {
        const review = createStartedReview();

        const checked = review.checkReject({
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID]
        });

        expect(checked.isOk()).toBe(true);
    });

    it("still lets the owner approve without a comment", () => {
        const review = createStartedReview();

        expectOk(review.approve(rejectAs(reviewer, null)));

        expect(review.toData().steps[0]).toMatchObject({ state: "approved", comment: null });
    });

    it("stores the approve comment trimmed, and a blank one as none", () => {
        const trimmed = createStartedReview();
        expectOk(trimmed.approve(rejectAs(reviewer, "  Looks good.  ")));
        expect(trimmed.toData().steps[0]).toMatchObject({ comment: "Looks good." });
        expect(trimmed.pullFacts().find(fact => fact.type === "stepApproved")).toMatchObject({
            comment: "Looks good."
        });

        for (const comment of ["", "   "]) {
            const blank = createStartedReview();
            expectOk(blank.approve(rejectAs(reviewer, comment)));
            expect(blank.toData().steps[0]).toMatchObject({ comment: null });
        }
    });
});
