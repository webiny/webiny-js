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
import { isEmptyReviewListFilter } from "~/domain/review/isEmptyReviewListFilter.js";
import { getDefaultReviewListSort } from "~/domain/review/getDefaultReviewListSort.js";
import type { ReviewListScope } from "~/domain/review/ReviewListScope.js";
import type { ReviewListState } from "~/domain/review/ReviewListState.js";
import type { ReviewListSort, ReviewListWhere } from "~/domain/review/types.js";

interface MatchCase {
    name: string;
    scope: ReviewListScope;
    review: Partial<ListedReviewParams>;
    where?: ReviewListWhere;
    expected: boolean;
}

const ALL_SCOPES: ReviewListScope[] = ["assignedToMe", "pool", "teamInReview", "myRequests", "all"];
const ALL_STATES: ReviewListState[] = ["all", "inReview", "failed", "approved", "rejected"];

/** A row that each scope keeps for the `reviewer` viewer (member of `REVIEW_TEAM_ID`). */
const MATCHING: Record<ReviewListScope, Partial<ListedReviewParams>> = {
    assignedToMe: { stepState: "inReview", ownerId: reviewer.id },
    pool: { stepState: "awaiting" },
    teamInReview: { stepState: "inReview", ownerId: otherReviewer.id },
    myRequests: { requester: reviewer },
    all: {}
};

/** isActive, model and titleContains apply to every scope. */
const COMMON_CASES: MatchCase[] = ALL_SCOPES.flatMap(scope => [
    { name: "active", scope, review: MATCHING[scope], expected: true },
    {
        name: "inactive",
        scope,
        review: { ...MATCHING[scope], isActive: false },
        expected: false
    },
    {
        name: "other model",
        scope,
        review: { ...MATCHING[scope], model: "cms.other" },
        expected: false
    },
    {
        name: "title words anywhere, any case",
        scope,
        review: { ...MATCHING[scope], title: "Spring LAUNCH plan" },
        where: { titleContains: "launch  spring" },
        expected: true
    },
    {
        name: "title missing a word",
        scope,
        review: { ...MATCHING[scope], title: "Spring LAUNCH plan" },
        where: { titleContains: "spring sale" },
        expected: false
    }
]);

const SCOPE_CASES: MatchCase[] = [
    {
        name: "owner is viewer, in review",
        scope: "assignedToMe",
        review: { stepState: "inReview", ownerId: reviewer.id },
        expected: true
    },
    {
        name: "owner is viewer, approved (held the final step)",
        scope: "assignedToMe",
        review: { state: "approved", stepState: "approved", ownerId: reviewer.id },
        expected: true
    },
    {
        name: "in review, owner is someone else",
        scope: "assignedToMe",
        review: { stepState: "inReview", ownerId: otherReviewer.id },
        expected: false
    },
    {
        name: "awaiting, shares one of several teams",
        scope: "pool",
        review: { stepState: "awaiting", teamIds: [OTHER_TEAM_ID, REVIEW_TEAM_ID] },
        expected: true
    },
    {
        name: "not awaiting",
        scope: "pool",
        review: { stepState: "inReview", ownerId: otherReviewer.id },
        expected: false
    },
    {
        name: "awaiting, no shared team",
        scope: "pool",
        review: { stepState: "awaiting", teamIds: [OTHER_TEAM_ID] },
        expected: false
    },
    {
        name: "awaiting, the viewer's own request",
        scope: "pool",
        review: { stepState: "awaiting", requester: reviewer },
        expected: false
    },
    {
        name: "owned by someone else, shared team",
        scope: "teamInReview",
        review: { stepState: "inReview", ownerId: otherReviewer.id },
        expected: true
    },
    {
        name: "no owner",
        scope: "teamInReview",
        review: { stepState: "awaiting", ownerId: null },
        expected: false
    },
    {
        name: "owned by the viewer",
        scope: "teamInReview",
        review: { stepState: "inReview", ownerId: reviewer.id },
        expected: false
    },
    {
        name: "owned by someone else, no shared team",
        scope: "teamInReview",
        review: { stepState: "inReview", ownerId: otherReviewer.id, teamIds: [OTHER_TEAM_ID] },
        expected: false
    },
    {
        name: "requested by the viewer",
        scope: "myRequests",
        review: { requester: reviewer },
        expected: true
    },
    {
        name: "requested by someone else",
        scope: "myRequests",
        review: { requester: otherReviewer },
        expected: false
    },
    {
        name: "anyone's review, any team",
        scope: "all",
        review: { requester: otherReviewer, teamIds: [OTHER_TEAM_ID] },
        expected: true
    }
];

interface StateCase {
    name: string;
    review: Partial<ListedReviewParams>;
    /** The states that keep the review. */
    states: ReviewListState[];
}

const STATE_CASES: StateCase[] = [
    { name: "awaiting", review: { stepState: "awaiting" }, states: ["all", "inReview"] },
    {
        name: "in review",
        review: { stepState: "inReview", ownerId: otherReviewer.id },
        states: ["all", "inReview"]
    },
    {
        name: "step failed",
        review: { stepState: "failed", stepType: "ai" },
        states: ["all", "failed"]
    },
    {
        name: "approved",
        review: { state: "approved", stepState: "approved" },
        states: ["all", "approved"]
    },
    {
        name: "rejected",
        review: { state: "rejected", stepState: "rejected" },
        states: ["all", "rejected"]
    }
];

const STATE_MATRIX = STATE_CASES.flatMap(testCase =>
    ALL_STATES.map(state => ({
        name: testCase.name,
        review: testCase.review,
        state,
        expected: testCase.states.includes(state)
    }))
);

const match = (scope: ReviewListScope, review: Partial<ListedReviewParams>, where = {}) => {
    return matchesReviewList(createListedReview({ id: "review-1", minute: 1, ...review }), {
        scope,
        viewerUserId: reviewer.id,
        viewerTeamIds: [REVIEW_TEAM_ID],
        models: [ARTICLE_MODEL],
        where
    });
};

describe("matchesReviewList (R91, A40, B2 design 1)", () => {
    it.each([...COMMON_CASES, ...SCOPE_CASES])(
        "$scope: $name -> $expected",
        ({ scope, review, where, expected }) => {
            expect(match(scope, review, where ?? {})).toBe(expected);
        }
    );

    it.each(STATE_MATRIX)("state $state: $name -> $expected", ({ review, state, expected }) => {
        expect(match("all", review, { state })).toBe(expected);
    });

    it("ANDs the scope and the state", () => {
        const approvedOwn = {
            requester: reviewer,
            state: "approved",
            stepState: "approved"
        } as const;

        expect(match("myRequests", approvedOwn, { state: "approved" })).toBe(true);
        expect(match("myRequests", approvedOwn, { state: "inReview" })).toBe(false);
        expect(match("pool", { stepState: "awaiting" }, { state: "inReview" })).toBe(true);
        expect(match("pool", { stepState: "awaiting" }, { state: "approved" })).toBe(false);
    });
});

describe("isEmptyReviewListFilter (B2 design 1)", () => {
    const EMPTY: string[] = [
        "pool×failed",
        "pool×approved",
        "pool×rejected",
        "assignedToMe×failed",
        "teamInReview×failed"
    ];
    const PAIRS = ALL_SCOPES.flatMap(scope =>
        ALL_STATES.map(state => ({
            scope,
            state,
            expected: EMPTY.includes(`${scope}×${state}`)
        }))
    );

    it.each(PAIRS)("$scope × $state -> $expected", ({ scope, state, expected }) => {
        expect(isEmptyReviewListFilter(scope, state)).toBe(expected);
    });
});

describe("getDefaultReviewListSort (D119, B2 design 1)", () => {
    const PAIRS = ALL_SCOPES.flatMap(scope =>
        ALL_STATES.map(state => {
            const oldestFirst =
                scope === "pool" ||
                (scope !== "myRequests" && (state === "inReview" || state === "failed"));
            const expected: ReviewListSort = oldestFirst
                ? "lastChangedOn_ASC"
                : "lastChangedOn_DESC";
            return { scope, state, expected };
        })
    );

    it.each(PAIRS)("$scope × $state -> $expected", ({ scope, state, expected }) => {
        expect(getDefaultReviewListSort(scope, state)).toBe(expected);
    });
});
