import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import type { CancelForDeleteParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ListBlockingReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ListStepCandidatesParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { RequestReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ApproveReviewGatewayParams } from "~/review/gateway/params.js";
import type { CancelReviewGatewayParams } from "~/review/gateway/params.js";
import type { GetReviewGatewayParams } from "~/review/gateway/params.js";
import type { GetStepRunGatewayParams } from "~/review/gateway/params.js";
import type { ListReviewStepCandidatesGatewayParams } from "~/review/gateway/params.js";
import type { ListReviewsGatewayParams } from "~/review/gateway/params.js";
import type { ReassignReviewGatewayParams } from "~/review/gateway/params.js";
import type { RejectReviewGatewayParams } from "~/review/gateway/params.js";
import type { ReviewStepGatewayParams } from "~/review/gateway/params.js";
import type { TakeOverReviewGatewayParams } from "~/review/gateway/params.js";

/*
 * The review data of every app (R343, R350): domain values over `ReviewGateway`, and the workflow
 * list cached per app. It never swallows an error.
 */
export interface IReviewRepository {
    // The workflow list of the namespace's app, read once and cached until it is invalidated.
    listWorkflows(namespace: string): Promise<ReviewWorkflow[]>;
    // Drops the app's cached list, also a load in flight; callers already awaiting keep their result.
    invalidateWorkflows(app: WorkflowAppKind): void;
    getTargetReview(params: ReviewTarget): Promise<ReviewWithFlags | null>;
    getReview(params: GetReviewGatewayParams): Promise<ReviewWithFlags>;
    listStepCandidates(params: ListStepCandidatesParams): Promise<StepCandidate[]>;
    listReviewStepCandidates(
        params: ListReviewStepCandidatesGatewayParams
    ): Promise<StepCandidate[]>;
    getStepRun(params: GetStepRunGatewayParams): Promise<ReviewStepRunInfo | null>;
    listReviews(params: ListReviewsGatewayParams): Promise<ReviewListPage>;
    requestReview(params: RequestReviewParams): Promise<Review>;
    startStep(params: ReviewStepGatewayParams): Promise<Review>;
    takeOverStep(params: TakeOverReviewGatewayParams): Promise<Review>;
    reassignStep(params: ReassignReviewGatewayParams): Promise<Review>;
    approveStep(params: ApproveReviewGatewayParams): Promise<Review>;
    rejectStep(params: RejectReviewGatewayParams): Promise<Review>;
    cancelReview(params: CancelReviewGatewayParams): Promise<Review>;
    restartStep(params: ReviewStepGatewayParams): Promise<Review>;
    cancelForDelete(params: CancelForDeleteParams): Promise<Review[]>;
    listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]>;
}

export const ReviewRepository = createAbstraction<IReviewRepository>("Workflows/ReviewRepository");

export namespace ReviewRepository {
    export type Interface = IReviewRepository;
}
