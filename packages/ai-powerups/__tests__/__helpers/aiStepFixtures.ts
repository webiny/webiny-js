import { Review } from "@webiny/api-workflows/domain/review/Review.js";
import type { Actor, TargetContext } from "@webiny/api-workflows/domain/review/types.js";
import { AI_STEP_TYPE } from "@webiny/api-workflows/domain/workflow/stepTypes.js";
import type {
    Workflow,
    WorkflowStep,
    WorkflowValues
} from "@webiny/api-workflows/domain/workflow/types.js";
import type { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";

export const NOW = "2026-10-09T10:00:00.000Z";
export const ARTICLE_MODEL = "cms.article";
export const AI_STEP_ID = "ai-check";
export const AI_MODEL = "anthropic/claude-a";

export const requester: Actor = {
    type: "user",
    id: "user-requester",
    displayName: "Rita Requester",
    identityType: "admin"
};

export const targetContext: TargetContext = {
    folder: { id: "folder-1", type: "cms:article" },
    modelId: "article",
    title: "Article 1",
    author: { id: "user-requester", displayName: "Rita Requester" }
};

export const createAiStepConfig = (
    overrides: Record<string, unknown> = {}
): Record<string, unknown> => {
    return {
        instructions: "Check that the tone is friendly.",
        model: AI_MODEL,
        tools: [],
        ...overrides
    };
};

export interface AiStepFixtureParams {
    id?: string;
    title?: string;
    config?: unknown;
}

/** A workflow step of type "ai"; `config` defaults to a valid one when the key is not given. */
export const createAiStep = (params: AiStepFixtureParams = {}): WorkflowStep => {
    return {
        id: params.id ?? AI_STEP_ID,
        title: params.title ?? "AI check",
        color: "#3b82f6",
        type: AI_STEP_TYPE,
        notifications: [],
        config: "config" in params ? params.config : createAiStepConfig()
    };
};

export const createAiWorkflowValues = (step: WorkflowStep): WorkflowValues => {
    return { id: "workflow-1", name: "Article review", models: [ARTICLE_MODEL], steps: [step] };
};

/** What `validate` and `checkConfig` receive for one step of a one-step workflow. */
export const paramsFor = (step: WorkflowStep): StepType.ValidateParams => {
    return { step, workflow: createAiWorkflowValues(step) };
};

export interface AiReviewFixtureParams {
    /** The stored config of the AI step; passing the key with `undefined` is a config that is missing. */
    config?: unknown;
    requester?: Actor;
}

/** Requested, nothing reached: the AI step is the pending first step of a one-step workflow. */
export const createAiReview = (params: AiReviewFixtureParams = {}): Review => {
    const step = createAiStep("config" in params ? { config: params.config } : {});
    const workflow: Workflow = {
        ...createAiWorkflowValues(step),
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: "admin", displayName: "Admin", type: "admin" },
        savedBy: { id: "admin", displayName: "Admin", type: "admin" }
    };
    const requested = Review.request({
        id: "review-1",
        workflow,
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        targetContext,
        picks: [],
        requester: params.requester ?? requester,
        now: NOW
    });
    if (requested.isFail()) {
        throw requested.error;
    }
    return requested.value;
};
