import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { AUTHOR_NAMESPACE, expectOk, getAuthorModel } from "./entries.js";
import { REQUESTER, REVIEW_TEAM, REVIEWER, toActor } from "./identities.js";

/** The only step of the test workflow (`__workflows/workflow.ts`). */
export const STEP_ID = "step-1";

/** Requests a review through the engine (no wrapper checks), as `requester`. */
export const requestEntryReview = async (
    context: CmsContext,
    entry: CmsEntry,
    requester: IdentityData = REQUESTER,
    model: string = AUTHOR_NAMESPACE
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(RequestReviewUseCase).execute({
            model,
            targetId: entry.entryId,
            targetRevisionId: entry.id,
            actor: toActor(requester)
        })
    );
};

export const startEntryReview = async (
    context: CmsContext,
    review: ReviewData,
    reviewer: IdentityData = REVIEWER
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(StartReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(reviewer),
            actorTeamIds: [REVIEW_TEAM]
        })
    );
};

/** Starts and approves the only step, so the review is `approved`. */
export const approveEntryReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    await startEntryReview(context, review);
    return expectOk(
        await context.container.resolve(ApproveReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(REVIEWER),
            actorTeamIds: [REVIEW_TEAM],
            comment: null
        })
    );
};

/** Starts and rejects the only step, so the review is `rejected` (and stays active, D23). */
export const rejectEntryReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    await startEntryReview(context, review);
    return expectOk(
        await context.container.resolve(RejectReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(REVIEWER),
            actorTeamIds: [REVIEW_TEAM],
            comment: "Needs another pass."
        })
    );
};

export const cancelEntryReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(CancelReviewUseCase).execute({
            reviewId: review.id,
            actor: toActor(REQUESTER)
        })
    );
};

/** The stored revision, read without access checks. */
export const readEntry = async (context: CmsContext, revisionId: string): Promise<CmsEntry> => {
    const model = await getAuthorModel(context);
    return expectOk(
        await context.container.resolve(GetRevisionByIdUseCase).execute(model, revisionId)
    );
};
