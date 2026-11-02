import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { BlockingReviewDto } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewListResultDto } from "./dto.js";
import type { ReviewStepRunInfoDto } from "./dto.js";
import type { ReviewWithFlagsDto } from "./dto.js";
import type { StepCandidateDto } from "./dto.js";
import type { WorkflowDto } from "./dto.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { CancelForDeleteParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ListBlockingReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ListStepCandidatesParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { RequestReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ApproveReviewGatewayParams } from "./params.js";
import type { CancelReviewGatewayParams } from "./params.js";
import type { GetReviewGatewayParams } from "./params.js";
import type { GetStepRunGatewayParams } from "./params.js";
import type { ListReviewStepCandidatesGatewayParams } from "./params.js";
import type { ListReviewsGatewayParams } from "./params.js";
import type { ReassignReviewGatewayParams } from "./params.js";
import type { RejectReviewGatewayParams } from "./params.js";
import type { ReviewStepGatewayParams } from "./params.js";
import type { TakeOverReviewGatewayParams } from "./params.js";

/*
 * The app-neutral review gateway (R347). It routes each call to the app gateway that serves it
 * and unwraps the envelope (R346): it returns DTOs and throws a `GraphQLOperationError` for an
 * error envelope or missing data (`getTargetReview` and `getStepRun` answer `null` as a value).
 * A transport `Error`, and a plain `Error` of an app gateway, pass as is. A namespace or an app
 * nobody claims throws a plain `Error` (R361).
 */
export interface IReviewGateway {
    // The app of the gateway that claims the namespace; the workflow cache key (R350).
    getApp(namespace: string): WorkflowAppKind;
    listWorkflows(app: WorkflowAppKind): Promise<WorkflowDto[]>;
    getTargetReview(params: ReviewTarget): Promise<ReviewWithFlagsDto | null>;
    getReview(params: GetReviewGatewayParams): Promise<ReviewWithFlagsDto>;
    listStepCandidates(params: ListStepCandidatesParams): Promise<StepCandidateDto[]>;
    listReviewStepCandidates(
        params: ListReviewStepCandidatesGatewayParams
    ): Promise<StepCandidateDto[]>;
    getStepRun(params: GetStepRunGatewayParams): Promise<ReviewStepRunInfoDto | null>;
    listReviews(params: ListReviewsGatewayParams): Promise<ReviewListResultDto>;
    requestReview(params: RequestReviewParams): Promise<ReviewDto>;
    startStep(params: ReviewStepGatewayParams): Promise<ReviewDto>;
    takeOverStep(params: TakeOverReviewGatewayParams): Promise<ReviewDto>;
    reassignStep(params: ReassignReviewGatewayParams): Promise<ReviewDto>;
    approveStep(params: ApproveReviewGatewayParams): Promise<ReviewDto>;
    rejectStep(params: RejectReviewGatewayParams): Promise<ReviewDto>;
    cancelReview(params: CancelReviewGatewayParams): Promise<ReviewDto>;
    restartStep(params: ReviewStepGatewayParams): Promise<ReviewDto>;
    cancelForDelete(params: CancelForDeleteParams): Promise<ReviewDto[]>;
    listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReviewDto[]>;
}

export const ReviewGateway = createAbstraction<IReviewGateway>("Workflows/ReviewGateway");

export namespace ReviewGateway {
    export type Interface = IReviewGateway;
}
