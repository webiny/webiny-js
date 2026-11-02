import { describe, expect, it } from "vitest";
import { requester, reviewer } from "~tests/__helpers/fixtures.js";
import { createChangeReview } from "~tests/__helpers/changeNotificationReviews.js";
import { getReviewChangeRecipients } from "~/domain/notifications/getReviewChangeRecipients.js";
import type { Actor } from "~/domain/review/types.js";

const OTHER: Actor = { type: "user", id: "user-other", displayName: "Olga Other" };
const AI: Actor = { type: "ai", id: requester.id, displayName: "AI check" };
const AUTOMATION: Actor = { type: "automation", id: requester.id, displayName: "Link checker" };

describe("getReviewChangeRecipients (R254)", () => {
    it("returns the requester and the current owner, requester first", () => {
        expect(getReviewChangeRecipients(createChangeReview(), OTHER)).toEqual([
            "user-requester",
            "user-reviewer"
        ]);
    });

    it("returns the requester alone when no user owns the step", () => {
        expect(getReviewChangeRecipients(createChangeReview(null), OTHER)).toEqual([
            "user-requester"
        ]);
    });

    it("returns a person once when the requester owns the step", () => {
        const review = createChangeReview(requester.id);

        expect(getReviewChangeRecipients(review, OTHER)).toEqual(["user-requester"]);
    });

    it("drops the actor when the actor is the requester as a user", () => {
        expect(getReviewChangeRecipients(createChangeReview(), requester)).toEqual([
            "user-reviewer"
        ]);
    });

    it("drops the actor when the actor is the owner as a user", () => {
        expect(getReviewChangeRecipients(createChangeReview(), reviewer)).toEqual([
            "user-requester"
        ]);
    });

    it("returns nobody when the one person is also the acting user", () => {
        const review = createChangeReview(requester.id);

        expect(getReviewChangeRecipients(review, requester)).toEqual([]);
    });

    it.each([
        { name: "an AI", actor: AI },
        { name: "an automation", actor: AUTOMATION }
    ])(
        "keeps the requester when $name acts, because it carries the requester's id (D58)",
        ({ actor }) => {
            expect(getReviewChangeRecipients(createChangeReview(), actor)).toEqual([
                "user-requester",
                "user-reviewer"
            ]);
        }
    );

    it("never returns an empty id", () => {
        const review = createChangeReview("");
        review.createdBy.id = "";

        expect(getReviewChangeRecipients(review, OTHER)).toEqual([]);
    });

    it("does not change the review", () => {
        const review = createChangeReview();
        const before = structuredClone(review);

        getReviewChangeRecipients(review, requester);

        expect(review).toEqual(before);
    });
});
