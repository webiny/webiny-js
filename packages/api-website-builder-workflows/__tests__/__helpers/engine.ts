import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import type { Actor, ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type {
    ReviewStepAssignmentConfig,
    Workflow,
    WorkflowValues
} from "@webiny/api-workflows/domain/workflow/types.js";
import { GetRevisionByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetRevisionById/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { expectOk, getPageModel } from "./pages.js";
import { ADMIN, REQUESTER, REVIEW_TEAM, REVIEWER, toActor } from "./identities.js";

export const STEP_ID = "step-1";

/** The default identity of `createCmsTestHandler`, as a workflow actor (R58). */
export const WB_ADMIN_ACTOR: Actor = toActor(ADMIN);

export const createWbWorkflowValues = (): WorkflowValues => {
    return {
        id: "wb-workflow",
        name: "Pages review",
        models: ["wb.page"],
        steps: [
            {
                id: STEP_ID,
                title: "Step 1",
                description: "This is step 1",
                color: "blue",
                type: "review",
                notifications: [],
                config: {
                    teams: [REVIEW_TEAM],
                    assignment: { strategy: "none", allowManualPick: false, rules: [] }
                }
            }
        ]
    };
};

/** Stores the pages workflow through the engine (no wrapper). */
export const storeWbWorkflow = async (context: CmsContext): Promise<Workflow> => {
    return expectOk(
        await context.container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createWbWorkflowValues(), actor: WB_ADMIN_ACTOR })
    );
};

/** The pages workflow with the given routing on its only step (team "team-1"). */
export const createWbWorkflowValuesWithAssignment = (
    assignment: ReviewStepAssignmentConfig
): WorkflowValues => {
    const values = createWbWorkflowValues();
    return {
        ...values,
        steps: values.steps.map(step => {
            return { ...step, config: { teams: [REVIEW_TEAM], assignment } };
        })
    };
};

/** Stores the pages workflow with the given routing through the engine (no wrapper). */
export const storeWbWorkflowWithAssignment = async (
    context: CmsContext,
    assignment: ReviewStepAssignmentConfig
): Promise<Workflow> => {
    return expectOk(
        await context.container.resolve(StoreWorkflowUseCase).execute({
            workflow: createWbWorkflowValuesWithAssignment(assignment),
            actor: WB_ADMIN_ACTOR
        })
    );
};

export const requestPageReview = async (
    context: CmsContext,
    page: WbPage,
    requester: IdentityData = REQUESTER
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(RequestReviewUseCase).execute({
            model: "wb.page",
            targetId: page.entryId,
            targetRevisionId: page.id,
            actor: toActor(requester)
        })
    );
};

export const startPageReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    return expectOk(
        await context.container.resolve(StartReviewStepUseCase).execute({
            reviewId: review.id,
            stepId: STEP_ID,
            actor: toActor(REVIEWER),
            actorTeamIds: [REVIEW_TEAM]
        })
    );
};

export const approvePageReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    await startPageReview(context, review);
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

export const rejectPageReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    await startPageReview(context, review);
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

export const cancelPageReview = async (
    context: CmsContext,
    review: ReviewData
): Promise<ReviewData> => {
    return expectOk(
        await context.container
            .resolve(CancelReviewUseCase)
            .execute({ reviewId: review.id, actor: toActor(REQUESTER) })
    );
};

/** The stored page revision as a CMS entry, read without access checks. */
export const readPage = async (context: CmsContext, revisionId: string): Promise<CmsEntry> => {
    const model = await getPageModel(context);
    return expectOk(
        await context.container.resolve(GetRevisionByIdUseCase).execute(model, revisionId)
    );
};
