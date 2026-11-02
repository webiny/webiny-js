import { toOperationError } from "~/gateway/toOperationError.js";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { ReviewAppGateway } from "~/review/appGateway/abstractions.js";
import type { BlockingReviewDto } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewListResultDto } from "./dto.js";
import type { ReviewStepRunInfoDto } from "./dto.js";
import type { ReviewWithFlagsDto } from "./dto.js";
import type { StepCandidateDto } from "./dto.js";
import type { WorkflowDto } from "./dto.js";
import { ReviewGateway as GatewayAbstraction } from "./abstractions.js";
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
 * Routes every review operation to the app gateway that serves it (R347): a review-bound
 * operation to the first gateway whose `canHandle(namespace)` is true, an app-wide list to the
 * first whose `app` matches. The app gateway gets the parameter object it always took, so no
 * GraphQL variable changes. The envelope is unwrapped here, once for every app (R346).
 *
 * Registration order (R349): this singleton collects the app gateways when it is first built.
 * Nothing that renders in the plugin pass may resolve it, or a repository or use case built on
 * it; route elements, editors and widgets resolve it after every app has registered.
 */
class ReviewGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private appGateways: ReviewAppGateway.Interface[]) {}

    getApp(namespace: string): WorkflowAppKind {
        const appGateway = this.forNamespace(namespace);
        return appGateway.app;
    }

    async listWorkflows(app: WorkflowAppKind): Promise<WorkflowDto[]> {
        const appGateway = this.forApp(app);
        const envelope = await appGateway.listWorkflows();
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getTargetReview(params: ReviewTarget): Promise<ReviewWithFlagsDto | null> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.getTargetReview(params);
        if (envelope.error) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getReview(params: GetReviewGatewayParams): Promise<ReviewWithFlagsDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.getReview(params.reviewId);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listStepCandidates(params: ListStepCandidatesParams): Promise<StepCandidateDto[]> {
        const appGateway = this.forNamespace(params.target.namespace);
        const envelope = await appGateway.listStepCandidates(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesGatewayParams
    ): Promise<StepCandidateDto[]> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.listReviewStepCandidates({
            reviewId: params.reviewId,
            stepId: params.stepId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getStepRun(params: GetStepRunGatewayParams): Promise<ReviewStepRunInfoDto | null> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.getStepRun({
            reviewId: params.reviewId,
            stepId: params.stepId,
            taskId: params.taskId
        });
        if (envelope.error) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listReviews(params: ListReviewsGatewayParams): Promise<ReviewListResultDto> {
        const appGateway = this.forApp(params.app);
        const envelope = await appGateway.listReviews({
            list: params.list,
            where: params.where,
            sort: params.sort,
            limit: params.limit,
            after: params.after
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return { data: envelope.data, meta: envelope.meta };
    }

    async requestReview(params: RequestReviewParams): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.target.namespace);
        const envelope = await appGateway.requestReview(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async startStep(params: ReviewStepGatewayParams): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.startStep({
            reviewId: params.reviewId,
            stepId: params.stepId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async takeOverStep(params: TakeOverReviewGatewayParams): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.takeOverStep({
            reviewId: params.reviewId,
            stepId: params.stepId,
            notifyPreviousOwner: params.notifyPreviousOwner
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async reassignStep(params: ReassignReviewGatewayParams): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.reassignStep({
            reviewId: params.reviewId,
            stepId: params.stepId,
            userId: params.userId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async approveStep(params: ApproveReviewGatewayParams): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.approveStep({
            reviewId: params.reviewId,
            stepId: params.stepId,
            comment: params.comment
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async rejectStep(params: RejectReviewGatewayParams): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.rejectStep({
            reviewId: params.reviewId,
            stepId: params.stepId,
            comment: params.comment
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async cancelReview(params: CancelReviewGatewayParams): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.cancelReview({ reviewId: params.reviewId });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async restartStep(params: ReviewStepGatewayParams): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.restartStep({
            reviewId: params.reviewId,
            stepId: params.stepId
        });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async cancelForDelete(params: CancelForDeleteParams): Promise<ReviewDto[]> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.cancelForDelete(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReviewDto[]> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.listBlockingReviews(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    private forNamespace(namespace: string): ReviewAppGateway.Interface {
        const appGateway = this.appGateways.find(item => item.canHandle(namespace));
        if (!appGateway) {
            throw new Error(`No workflows app handles the namespace "${namespace}".`);
        }
        return appGateway;
    }

    private forApp(app: WorkflowAppKind): ReviewAppGateway.Interface {
        const appGateway = this.appGateways.find(item => item.app === app);
        if (!appGateway) {
            throw new Error(`No workflows app is registered for "${app}".`);
        }
        return appGateway;
    }
}

export const ReviewGateway = GatewayAbstraction.createImplementation({
    implementation: ReviewGatewayImpl,
    dependencies: [[ReviewAppGateway, { multiple: true }]]
});
