import { describe, expect, it } from "vitest";
import { createListedReview, type ListedReviewParams } from "~tests/__helpers/listedReviews.js";
import {
    ARTICLE_MODEL,
    OTHER_TEAM_ID,
    otherReviewer,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import { matchesReviewList } from "~/domain/review/matchesReviewList.js";
import type { ReviewListKind, ReviewListWhere } from "~/domain/review/types.js";

interface MatchCase {
    name: string;
    list: ReviewListKind;
    review: Partial<ListedReviewParams>;
    where?: ReviewListWhere;
    expected: boolean;
}

/** A row that each list keeps for the `reviewer` viewer (member of `REVIEW_TEAM_ID`). */
const MATCHING: Record<ReviewListKind, Partial<ListedReviewParams>> = {
    assignedToMe: { stepState: "inReview", ownerId: reviewer.id },
    pool: { stepState: "awaiting" },
    teamInReview: { stepState: "inReview", ownerId: otherReviewer.id },
    myRequests: { requester: reviewer },
    failedSteps: { stepState: "failed", stepType: "ai" }
};

const ALL_LISTS: ReviewListKind[] = [
    "assignedToMe",
    "pool",
    "teamInReview",
    "myRequests",
    "failedSteps"
];

/** isActive, model and titleContains apply to every list. */
const COMMON_CASES: MatchCase[] = ALL_LISTS.flatMap(list => [
    { name: "active", list, review: MATCHING[list], expected: true },
    {
        name: "inactive",
        list,
        review: { ...MATCHING[list], isActive: false },
        expected: false
    },
    {
        name: "other model",
        list,
        review: { ...MATCHING[list], model: "cms.other" },
        expected: false
    },
    {
        name: "title words anywhere, any case",
        list,
        review: { ...MATCHING[list], title: "Spring LAUNCH plan" },
        where: { titleContains: "launch  spring" },
        expected: true
    },
    {
        name: "title missing a word",
        list,
        review: { ...MATCHING[list], title: "Spring LAUNCH plan" },
        where: { titleContains: "spring sale" },
        expected: false
    }
]);

const LIST_CASES: MatchCase[] = [
    {
        name: "owner is viewer, in review",
        list: "assignedToMe",
        review: { stepState: "inReview", ownerId: reviewer.id },
        expected: true
    },
    {
        name: "owner is viewer, not in review",
        list: "assignedToMe",
        review: { stepState: "awaiting", ownerId: reviewer.id },
        expected: false
    },
    {
        name: "in review, owner is someone else",
        list: "assignedToMe",
        review: { stepState: "inReview", ownerId: otherReviewer.id },
        expected: false
    },
    {
        name: "awaiting, shares one of several teams",
        list: "pool",
        review: { stepState: "awaiting", teamIds: [OTHER_TEAM_ID, REVIEW_TEAM_ID] },
        expected: true
    },
    {
        name: "not awaiting",
        list: "pool",
        review: { stepState: "inReview", ownerId: otherReviewer.id },
        expected: false
    },
    {
        name: "awaiting, no shared team",
        list: "pool",
        review: { stepState: "awaiting", teamIds: [OTHER_TEAM_ID] },
        expected: false
    },
    {
        name: "awaiting, the viewer's own request",
        list: "pool",
        review: { stepState: "awaiting", requester: reviewer },
        expected: false
    },
    {
        name: "in review by someone else, shared team",
        list: "teamInReview",
        review: { stepState: "inReview", ownerId: otherReviewer.id },
        expected: true
    },
    {
        name: "awaiting",
        list: "teamInReview",
        review: { stepState: "awaiting", ownerId: otherReviewer.id },
        expected: false
    },
    {
        name: "in review by the viewer",
        list: "teamInReview",
        review: { stepState: "inReview", ownerId: reviewer.id },
        expected: false
    },
    {
        name: "in review by someone else, no shared team",
        list: "teamInReview",
        review: { stepState: "inReview", ownerId: otherReviewer.id, teamIds: [OTHER_TEAM_ID] },
        expected: false
    },
    {
        name: "requested by the viewer",
        list: "myRequests",
        review: { requester: reviewer },
        expected: true
    },
    {
        name: "requested by someone else",
        list: "myRequests",
        review: { requester: otherReviewer },
        expected: false
    },
    {
        name: "review state matches",
        list: "myRequests",
        review: { requester: reviewer, state: "approved", stepState: "approved" },
        where: { reviewState: "approved" },
        expected: true
    },
    {
        name: "review state differs",
        list: "myRequests",
        review: { requester: reviewer },
        where: { reviewState: "approved" },
        expected: false
    },
    {
        name: "step state matches",
        list: "myRequests",
        review: { requester: reviewer, stepState: "awaiting" },
        where: { stepState: "awaiting" },
        expected: true
    },
    {
        name: "step state differs",
        list: "myRequests",
        review: { requester: reviewer, stepState: "inReview", ownerId: otherReviewer.id },
        where: { stepState: "awaiting" },
        expected: false
    },
    {
        name: "failed AI step",
        list: "failedSteps",
        review: { stepState: "failed", stepType: "ai" },
        expected: true
    },
    {
        name: "failed automation step",
        list: "failedSteps",
        review: { stepState: "failed", stepType: "automation" },
        expected: true
    },
    {
        name: "AI step not failed",
        list: "failedSteps",
        review: { stepState: "awaiting", stepType: "ai" },
        expected: false
    },
    {
        name: "failed review step",
        list: "failedSteps",
        review: { stepState: "failed", stepType: "review" },
        expected: false
    },
    {
        name: "failed, no step type",
        list: "failedSteps",
        review: { stepState: "failed", stepType: null },
        expected: false
    }
];

describe("matchesReviewList (R91, A40)", () => {
    it.each([...COMMON_CASES, ...LIST_CASES])(
        "$list: $name -> $expected",
        ({ list, review, where, expected }) => {
            const matched = matchesReviewList(
                createListedReview({ id: "review-1", minute: 1, ...review }),
                {
                    list,
                    viewerUserId: reviewer.id,
                    viewerTeamIds: [REVIEW_TEAM_ID],
                    models: [ARTICLE_MODEL],
                    where: where ?? {}
                }
            );

            expect(matched).toBe(expected);
        }
    );
});
