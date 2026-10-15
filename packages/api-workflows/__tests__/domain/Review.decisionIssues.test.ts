import { describe, expect, it } from "vitest";
import {
    createAiIssue,
    createStartedReview,
    expectOk,
    otherReviewer,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

interface DecisionExtra {
    comment?: string | null;
    issues?: ReturnType<typeof createAiIssue>[];
}

const decision = (extra: DecisionExtra) => {
    return {
        stepId: "legal",
        actor: reviewer,
        actorTeamIds: [REVIEW_TEAM_ID],
        comment: extra.comment ?? null,
        now: LATER,
        ...(extra.issues ? { issues: extra.issues } : {})
    };
};

describe("Review.approve stores the issues (R171)", () => {
    it("stores the given issues on the step, in order", () => {
        const review = createStartedReview();
        const issues = [
            createAiIssue(),
            createAiIssue({ fieldPath: null, severity: "info", suggestion: null })
        ];

        expectOk(review.approve(decision({ comment: "Fine with notes.", issues })));

        const steps = review.toData().steps;
        expect(steps[0]).toMatchObject({ state: "approved", comment: "Fine with notes." });
        expect(steps[0].issues).toEqual(issues);
        expect(steps[1].issues).toEqual([]);
    });

    it("stores no issues when none are given", () => {
        const review = createStartedReview();

        expectOk(review.approve(decision({})));

        expect(review.toData().steps[0].issues).toEqual([]);
    });

    it("stores a copy, so changing the input afterwards changes nothing", () => {
        const review = createStartedReview();
        const issues = [createAiIssue()];

        expectOk(review.approve(decision({ issues })));
        issues[0].message = "Changed after approve.";
        issues.push(createAiIssue({ severity: "error" }));

        expect(review.toData().steps[0].issues).toEqual([createAiIssue()]);
    });

    it("leaves the facts without issues", () => {
        const review = createStartedReview();

        expectOk(review.approve(decision({ comment: "Fine.", issues: [createAiIssue()] })));

        expect(review.pullFacts()).toEqual([
            {
                type: "stepApproved",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "approved" },
                comment: "Fine."
            }
        ]);
    });

    it("stores nothing when the approve is refused", () => {
        const review = createStartedReview();

        const result = review.approve({
            ...decision({ issues: [createAiIssue()] }),
            actor: otherReviewer
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotOwner");
        expect(review.toData().steps[0]).toMatchObject({ state: "inReview", issues: [] });
    });
});

describe("Review.reject stores the issues (R171)", () => {
    it("stores the given issues next to the trimmed comment", () => {
        const review = createStartedReview();
        const issues = [createAiIssue({ severity: "error", message: "The body is empty." })];

        expectOk(review.reject(decision({ comment: "  The body is empty.  ", issues })));

        const data = review.toData();
        expect(data.state).toBe("rejected");
        expect(data.steps[0]).toMatchObject({ state: "rejected", comment: "The body is empty." });
        expect(data.steps[0].issues).toEqual(issues);
    });

    it("stores no issues when none are given", () => {
        const review = createStartedReview();

        expectOk(review.reject(decision({ comment: "Not ready to publish." })));

        expect(review.toData().steps[0].issues).toEqual([]);
    });

    it("stores a copy, so changing the input afterwards changes nothing", () => {
        const review = createStartedReview();
        const issues = [createAiIssue()];

        expectOk(review.reject(decision({ comment: "Not ready to publish.", issues })));
        issues[0].severity = "info";

        expect(review.toData().steps[0].issues).toEqual([createAiIssue()]);
    });

    it("leaves the facts without issues", () => {
        const review = createStartedReview();

        expectOk(
            review.reject(decision({ comment: "Not ready to publish.", issues: [createAiIssue()] }))
        );

        expect(review.pullFacts()).toEqual([
            {
                type: "stepRejected",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
                comment: "Not ready to publish."
            }
        ]);
    });

    it("stores nothing when the comment is too short", () => {
        const review = createStartedReview();

        const result = review.reject(decision({ comment: "No.", issues: [createAiIssue()] }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(review.toData().steps[0]).toMatchObject({ state: "inReview", issues: [] });
    });

    it("stores nothing when the reject is refused", () => {
        const review = createStartedReview();

        const result = review.reject({
            ...decision({ comment: "Not ready to publish.", issues: [createAiIssue()] }),
            actor: otherReviewer
        });

        expect(result.isFail()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({ state: "inReview", issues: [] });
    });
});
