import { getAiActor } from "@webiny/api-workflows/domain/ai/getAiActor.js";
import type {
    Actor,
    ReviewData,
    ReviewStep,
    StepState
} from "@webiny/api-workflows/domain/review/types.js";
import type { StepRunTaskIdentity } from "@webiny/api-workflows/domain/review/getStaleStepRunReason.js";
import {
    AI_MODEL,
    AI_STEP_ID,
    NOW,
    createAiReview,
    createAiStepConfig,
    requester
} from "./aiStepFixtures.js";

export const AI_REVIEW_ID = createAiReview().toData().id;
export const AI_TASK_ID = "task-1";

/** The identity of the running task: created by the requester, carrying the step's task id. */
export const AI_TASK: StepRunTaskIdentity = { id: AI_TASK_ID, createdById: requester.id };

export interface PreviousStepOptions {
    state: StepState;
    comment: string | null;
    /** Defaults to "Lena Legal"; `null` is a step without an owner. */
    owner?: Actor | null;
}

export interface RunningAiReviewOptions {
    tools?: string[];
    instructions?: string;
    model?: string;
    /** Replaces the whole step config, for a config that does not parse. */
    config?: unknown;
    /** The review step before the AI step; `null` leaves it out. Defaults to an approved step. */
    previousStep?: PreviousStepOptions | null;
}

const LEGAL: Actor = { type: "user", id: "user-legal", displayName: "Lena Legal" };

const createPreviousStep = (ai: ReviewStep, options: PreviousStepOptions): ReviewStep => {
    return {
        ...ai,
        id: "legal-step",
        title: "Legal",
        type: "review",
        state: options.state,
        comment: options.comment,
        owner: options.owner === undefined ? LEGAL : options.owner,
        config: {},
        taskId: null
    };
};

/**
 * Task 17's requested review with the `ai` step moved to `inReview` under task `task-1`, created
 * by `requester`. The earlier step "Legal" is approved with the comment "Cleared by legal." by
 * default.
 */
export const createRunningAiReview = (options: RunningAiReviewOptions = {}): ReviewData => {
    const config =
        options.config ??
        createAiStepConfig({
            instructions: options.instructions ?? "Check the tone.",
            model: options.model ?? AI_MODEL,
            tools: options.tools ?? []
        });
    const base = createAiReview({ config }).toData();
    const ai: ReviewStep = {
        ...base.steps[0],
        state: "inReview",
        owner: getAiActor(requester),
        taskId: AI_TASK_ID,
        reachedOn: NOW,
        startedOn: NOW
    };
    const previous =
        options.previousStep === undefined
            ? { state: "approved" as StepState, comment: "Cleared by legal." }
            : options.previousStep;
    return {
        ...base,
        isActive: true,
        state: "inProgress",
        currentStepId: AI_STEP_ID,
        currentStepState: "inReview",
        currentStepType: "ai",
        currentOwnerId: null,
        currentCandidateTeamIds: [],
        steps: previous ? [createPreviousStep(ai, previous), ai] : [ai]
    };
};

/** The stored review after the requester cancelled it (the guard sees an inactive review). */
export const cancelStoredReview = (review: ReviewData): ReviewData => {
    return { ...review, isActive: false, state: "cancelled" };
};

/** The stored review after the step was restarted under another task. */
export const restartStoredStep = (review: ReviewData, taskId: string): ReviewData => {
    return {
        ...review,
        steps: review.steps.map(step => {
            return step.id === AI_STEP_ID ? { ...step, taskId } : step;
        })
    };
};
