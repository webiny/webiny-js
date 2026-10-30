import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { toReviewListRow } from "./toReviewListRow.js";
import { ReviewState } from "./ReviewState.js";
import { StepState } from "./StepState.js";
import { createActorDto } from "~/review/testing/reviewFixtures.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createStepDto } from "~/review/testing/reviewFixtures.js";
import { createViewerFlagsDto } from "~/review/testing/reviewFixtures.js";
import { T3 } from "~/review/testing/reviewFixtures.js";
import { mapReviewWithFlags } from "~/review/gateway/mapReviewWithFlags.js";

describe("toReviewListRow", () => {
    it("maps a review without a step owner to an app-neutral row", () => {
        const item = mapReviewWithFlags(
            createReviewWithFlagsDto({
                flags: createViewerFlagsDto({ canStart: true, canCancel: true })
            })
        );

        const row = toReviewListRow(item);

        expect(row).toEqual({
            namespace: "cms.article",
            reviewId: "review-1",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Launch article",
            reviewState: ReviewState.InProgress,
            stepId: "step-2",
            stepTitle: "Editorial check",
            stepColor: "#2f80ed",
            stepState: StepState.Awaiting,
            owner: null,
            requester: {
                type: "user",
                id: "user-2",
                displayName: "Grace Hopper",
                identityType: "admin"
            },
            lastChangedOn: T3,
            contentTypeId: "article",
            flags: {
                canStart: true,
                canTakeOver: false,
                canApprove: false,
                canReject: false,
                canCancel: true,
                canReassign: false,
                canRestart: false
            }
        });
    });

    it("carries the current step owner", () => {
        const item = mapReviewWithFlags(
            createReviewWithFlagsDto({
                review: createReviewDto({
                    currentStepId: "step-1",
                    currentStepState: "inReview",
                    steps: [
                        createStepDto({
                            id: "step-1",
                            title: "Draft check",
                            state: "inReview",
                            owner: createActorDto({ id: "user-7", displayName: "Edsger Dijkstra" })
                        })
                    ]
                })
            })
        );

        const row = toReviewListRow(item);

        expect(row.stepTitle).toBe("Draft check");
        expect(row.owner).toEqual({
            type: "user",
            id: "user-7",
            displayName: "Edsger Dijkstra",
            identityType: "admin"
        });
    });

    it("leaves step fields empty for a review without a current step", () => {
        const item = mapReviewWithFlags(
            createReviewWithFlagsDto({
                review: createReviewDto({
                    state: "cancelled",
                    isActive: false,
                    currentStepId: null,
                    currentStepState: null,
                    currentStepType: null
                })
            })
        );

        const row = toReviewListRow(item);

        expect(row.reviewState).toBe(ReviewState.Cancelled);
        expect(row.stepId).toBeNull();
        expect(row.stepTitle).toBeNull();
        expect(row.stepColor).toBeNull();
        expect(row.stepState).toBeNull();
        expect(row.owner).toBeNull();
    });
});
