import type { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import type {
    Actor,
    AiIssue,
    ReviewData,
    ReviewPick,
    StepAssignmentResolution,
    TargetContext
} from "~/domain/review/types.js";
import type { Workflow, WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import type { AssignmentDecision } from "~/domain/assignment/types.js";

export const NOW = "2026-10-09T10:00:00.000Z";
export const REVIEW_TEAM_ID = "team-reviewers";
export const OTHER_TEAM_ID = "team-other";
export const ARTICLE_MODEL = "cms.article";

/** Returns the value of an ok result; throws the error otherwise, so setup fails at its cause. */
export const expectOk = <TValue, TError>(result: Result<TValue, TError>): TValue => {
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

export interface ReviewStepFixtureParams {
    id: string;
    title: string;
    teams?: string[];
    allowManualPick?: boolean;
    rules?: unknown[];
}

export const createReviewStep = (params: ReviewStepFixtureParams): WorkflowStep => {
    return {
        id: params.id,
        title: params.title,
        color: "#3b82f6",
        type: "review",
        notifications: [],
        config: {
            teams: params.teams ?? [REVIEW_TEAM_ID],
            assignment: {
                strategy: "none",
                allowManualPick: params.allowManualPick ?? false,
                rules: params.rules ?? []
            }
        }
    };
};

export const createWorkflowValues = (overrides: Partial<WorkflowValues> = {}): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Article review",
        models: [ARTICLE_MODEL],
        steps: [
            createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ],
        ...overrides
    };
};

export const createWorkflow = (overrides: Partial<WorkflowValues> = {}): Workflow => {
    return {
        ...createWorkflowValues(overrides),
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: "admin", displayName: "Admin", type: "admin" },
        savedBy: { id: "admin", displayName: "Admin", type: "admin" }
    };
};

export const requester: Actor = {
    type: "user",
    id: "user-requester",
    displayName: "Rita Requester",
    identityType: "admin"
};

export const reviewer: Actor = {
    type: "user",
    id: "user-reviewer",
    displayName: "Rob Reviewer"
};

export const otherReviewer: Actor = {
    type: "user",
    id: "user-other-reviewer",
    displayName: "Olga Reviewer"
};

/** The workflow editor who stores and deletes workflows (R58). */
export const editor: Actor = {
    type: "user",
    id: "user-editor",
    displayName: "Eddie Editor",
    identityType: "admin"
};

/** AI owners carry the requester's id (D58) and are named by the step title (D107). */
export const aiActor: Actor = {
    type: "ai",
    id: "user-requester",
    displayName: "AI check"
};

export const targetContext: TargetContext = {
    folder: { id: "folder-1", type: "cms:article" },
    modelId: "article",
    title: "Article 1",
    author: { id: "user-requester", displayName: "Rita Requester" }
};

/** The outcome record of a step that went to the pool without a reason. */
export const poolOutcomeRecord = (): AssignmentDecision => {
    return { kind: "outcome", userId: null, source: "pool", ruleId: null, by: null, reason: null };
};

export const poolResolution = (): StepAssignmentResolution => {
    return {
        owner: null,
        candidateTeamIds: [REVIEW_TEAM_ID],
        assignment: { source: "pool" },
        records: [poolOutcomeRecord()]
    };
};

export interface RequestedReviewParams {
    id?: string;
    targetRevisionId?: string;
    picks?: ReviewPick[];
    workflow?: Workflow;
    /** Defaults to the `requester` fixture. */
    requester?: Actor;
}

/** A review whose first step was reached into the pool. Facts are left in place. */
export const createRequestedReview = (params: RequestedReviewParams = {}): Review => {
    const targetRevisionId = params.targetRevisionId ?? "article-1#0001";
    const review = expectOk(
        Review.request({
            id: params.id ?? "review-1",
            workflow: params.workflow ?? createWorkflow(),
            model: ARTICLE_MODEL,
            targetId: targetRevisionId.split("#")[0],
            targetRevisionId,
            title: "Article 1",
            targetContext,
            picks: params.picks ?? [],
            requester: params.requester ?? requester,
            now: NOW
        })
    );
    expectOk(
        review.reach({
            resolution: poolResolution(),
            actor: params.requester ?? requester,
            now: NOW
        })
    );
    return review;
};

/** A review whose first step ("legal") was started by `reviewer`. Facts are cleared. */
export const createStartedReview = (params: RequestedReviewParams = {}): Review => {
    const review = createRequestedReview(params);
    expectOk(
        review.start({
            stepId: "legal",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: NOW
        })
    );
    review.pullFacts();
    return review;
};

/** What the save path persists: prepared for save, facts discarded. */
export const toSaveData = (review: Review): ReviewData => {
    review.prepareForSave();
    review.pullFacts();
    return review.toData();
};

/** One AI finding; override any field. */
export const createAiIssue = (overrides: Partial<AiIssue> = {}): AiIssue => {
    return {
        fieldPath: "seo.title",
        severity: "warning",
        message: "The title is longer than 60 characters.",
        suggestion: "Shorten the title to 60 characters.",
        ...overrides
    };
};
