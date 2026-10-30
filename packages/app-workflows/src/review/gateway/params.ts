import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ApproveReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { CancelReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { GetStepRunParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ListReviewStepCandidatesParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReassignReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { RejectReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewStepRef } from "~/review/appGateway/IReviewAppGateway.js";
import type { TakeOverReviewParams } from "~/review/appGateway/IReviewAppGateway.js";

/*
 * The parameters of the routing gateway (R347): the app gateway's parameters plus the namespace
 * (or the app) that picks the app gateway. The repository and the use cases build on these.
 */
export interface GetReviewGatewayParams {
    namespace: string;
    reviewId: string;
}

export interface ListReviewStepCandidatesGatewayParams extends ListReviewStepCandidatesParams {
    namespace: string;
}

export interface GetStepRunGatewayParams extends GetStepRunParams {
    namespace: string;
}

export interface ListReviewsGatewayParams extends ListReviewsParams {
    app: WorkflowAppKind;
}

// Start and restart name only the step.
export interface ReviewStepGatewayParams extends ReviewStepRef {
    namespace: string;
}

export interface TakeOverReviewGatewayParams extends TakeOverReviewParams {
    namespace: string;
}

export interface ReassignReviewGatewayParams extends ReassignReviewParams {
    namespace: string;
}

export interface ApproveReviewGatewayParams extends ApproveReviewParams {
    namespace: string;
}

export interface RejectReviewGatewayParams extends RejectReviewParams {
    namespace: string;
}

export interface CancelReviewGatewayParams extends CancelReviewParams {
    namespace: string;
}
