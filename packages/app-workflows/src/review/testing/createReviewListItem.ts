import type { ReviewActor } from "~/review/domain/types.js";
import type { ReviewViewerFlags } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";
import { createActor } from "./createActor.js";
import { createFlags } from "./createFlags.js";
import { createReview } from "./reviewFixtures.js";
import { createReviewWithFlags } from "./reviewFixtures.js";
import { createStep } from "./createStep.js";

export interface ReviewListItemOverrides {
    id?: string;
    namespace?: string;
    targetId?: string;
    targetRevisionId?: string;
    title?: string;
    modelId?: string;
    state?: ReviewStateValue;
    stepId?: string;
    stepTitle?: string;
    stepState?: StepStateValue;
    owner?: ReviewActor | null;
    requester?: ReviewActor;
    lastChangedOn?: string;
    flags?: Partial<ReviewViewerFlags>;
}

/*
 * One review with one current step, built from the shared fixtures, as the list endpoints return
 * it.
 */
export const createReviewListItem = (overrides: ReviewListItemOverrides = {}): ReviewWithFlags => {
    const id = overrides.id ?? "review-1";
    const stepId = overrides.stepId ?? "step-1";
    const state = overrides.state ?? ReviewState.InProgress;
    const stepState = overrides.stepState ?? StepState.Awaiting;
    const owner = overrides.owner ?? null;
    const title = overrides.title ?? `Title of ${id}`;
    const lastChangedOn = overrides.lastChangedOn ?? "2026-10-16T10:00:00.000Z";

    const step = createStep({
        id: stepId,
        title: overrides.stepTitle ?? "Editorial check",
        state: stepState,
        owner
    });
    const review = createReview({
        id,
        namespace: overrides.namespace ?? "cms.article",
        targetId: overrides.targetId ?? `entry-${id}`,
        targetRevisionId: overrides.targetRevisionId ?? `entry-${id}#0001`,
        title,
        isActive: state === ReviewState.InProgress,
        state,
        currentStepId: stepId,
        currentStepState: stepState,
        currentOwnerId: owner ? owner.id : null,
        targetContext: {
            folder: null,
            modelId: overrides.modelId ?? "article",
            title,
            author: { id: "user-author", displayName: "Ana Horvat" }
        },
        steps: [step],
        createdBy: overrides.requester ?? createActor({ id: "user-requester" }),
        lastChangedOn
    });

    const flags = createFlags(overrides.flags);
    return createReviewWithFlags(review, flags);
};
