import type { ReviewActorDto } from "~/review/gateway/dto.js";
import type { ReviewDto } from "~/review/gateway/dto.js";
import type { ReviewStepDto } from "~/review/gateway/dto.js";
import type { ReviewWithFlagsDto } from "~/review/gateway/dto.js";
import type { ViewerFlagsDto } from "~/review/gateway/dto.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewViewerFlags } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";

export const T0 = "2026-10-16T08:00:00.000Z";
export const T1 = "2026-10-16T09:00:00.000Z";
export const T2 = "2026-10-16T10:00:00.000Z";
export const T3 = "2026-10-16T11:00:00.000Z";

export const createActorDto = (overrides: Partial<ReviewActorDto> = {}): ReviewActorDto => {
    return {
        type: "user",
        id: "user-1",
        displayName: "Ada Lovelace",
        identityType: "admin",
        ...overrides
    };
};

export const createStepDto = (overrides: Partial<ReviewStepDto> = {}): ReviewStepDto => {
    return {
        id: "step-1",
        title: "Editorial check",
        color: "#2f80ed",
        description: "Check the copy.",
        type: "review",
        state: "inReview",
        owner: createActorDto(),
        comment: null,
        pickedUserId: null,
        candidateTeamIds: ["team-1"],
        candidateTeams: [{ id: "team-1", name: "Editors" }],
        assignmentSource: "strategy",
        assignment: {
            source: "strategy",
            ruleId: null,
            reason: "Fewest open reviews.",
            by: null
        },
        reachedOn: T1,
        startedOn: T1,
        finishedOn: null,
        taskId: null,
        runs: [],
        issues: [],
        ...overrides
    };
};

export const createReviewDto = (overrides: Partial<ReviewDto> = {}): ReviewDto => {
    return {
        id: "review-1",
        workflowId: "workflow-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        isActive: true,
        state: "inProgress",
        currentStepId: "step-2",
        currentStepState: "awaiting",
        currentStepType: "review",
        currentOwnerId: null,
        currentCandidateTeamIds: ["team-1"],
        targetContext: {
            folder: { id: "folder-1", type: "FmCmsEntry" },
            modelId: "article",
            title: "Launch article",
            author: { id: "user-2", displayName: "Grace Hopper" }
        },
        workflow: { name: "Editorial", models: ["cms.article"] },
        steps: [
            createStepDto({
                id: "step-1",
                title: "Draft check",
                state: "approved",
                finishedOn: T2
            }),
            createStepDto({
                id: "step-2",
                title: "Editorial check",
                state: "awaiting",
                owner: null,
                assignmentSource: null,
                assignment: null,
                startedOn: null,
                finishedOn: null
            })
        ],
        createdBy: createActorDto({ id: "user-2", displayName: "Grace Hopper" }),
        cancelledBy: null,
        createdOn: T0,
        savedOn: T3,
        lastChangedOn: T3,
        ...overrides
    };
};

export const createViewerFlagsDto = (overrides: Partial<ViewerFlagsDto> = {}): ViewerFlagsDto => {
    return {
        canStart: true,
        canTakeOver: false,
        canApprove: false,
        canReject: false,
        canCancel: true,
        canReassign: false,
        canRestart: false,
        ...overrides
    };
};

export const createReviewWithFlagsDto = (
    overrides: Partial<ReviewWithFlagsDto> = {}
): ReviewWithFlagsDto => {
    return {
        review: createReviewDto(),
        flags: createViewerFlagsDto(),
        ...overrides
    };
};

/*
 * The domain review every later `app-workflows` test starts from (R243): one awaiting step
 * "Editorial check" (`step-1`), no teams, title "Spring campaign", requester "Maja Kos".
 */
export const createReview = (overrides: Partial<Review> = {}): Review => {
    return {
        id: "review-1",
        workflowId: "workflow-1",
        namespace: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Spring campaign",
        isActive: true,
        state: ReviewState.InProgress,
        currentStepId: "step-1",
        currentStepType: "review",
        currentOwnerId: null,
        currentStepState: StepState.Awaiting,
        currentCandidateTeamIds: [],
        targetContext: {
            folder: null,
            modelId: "article",
            title: "Spring campaign",
            author: { id: "user-1", displayName: "Maja Kos" }
        },
        workflowName: "Content review",
        steps: [
            {
                id: "step-1",
                title: "Editorial check",
                color: "#FA5723",
                description: null,
                type: "review",
                state: StepState.Awaiting,
                owner: null,
                comment: null,
                pickedUserId: null,
                candidateTeamIds: [],
                candidateTeams: [],
                assignmentSource: null,
                assignment: null,
                reachedOn: null,
                startedOn: null,
                finishedOn: null,
                taskId: null,
                runs: [],
                issues: [],
                assignments: null
            }
        ],
        createdBy: { type: "user", id: "user-1", displayName: "Maja Kos", identityType: null },
        cancelledBy: null,
        createdOn: T0,
        savedOn: T1,
        lastChangedOn: T1,
        ...overrides
    };
};

const NO_FLAGS: ReviewViewerFlags = {
    canStart: false,
    canTakeOver: false,
    canApprove: false,
    canReject: false,
    canCancel: false,
    canReassign: false,
    canRestart: false
};

// Positional (R243): the review first, then the flags; both default (all flags false).
export const createReviewWithFlags = (
    review: Review = createReview(),
    flags: ReviewViewerFlags = NO_FLAGS
): ReviewWithFlags => {
    return { review, flags };
};
