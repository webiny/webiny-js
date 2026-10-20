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
import type { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import type { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import type { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import type { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import type { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import type { GetTargetReviewUseCase } from "~/review/useCases/getTargetReview/abstractions.js";
import type { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import type { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import type { ListReviewsUseCase } from "~/review/useCases/listReviews/abstractions.js";
import type { ListStepCandidatesUseCase } from "~/review/useCases/listStepCandidates/abstractions.js";
import type { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import type { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import type { RequestReviewUseCase } from "~/review/useCases/requestReview/abstractions.js";
import type { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import type { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import type { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";

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

    async getTargetReview(
        params: GetTargetReviewUseCase.Params
    ): Promise<ReviewWithFlagsDto | null> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.getTargetReview(params);
        if (envelope.error) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async getReview(params: GetReviewUseCase.Params): Promise<ReviewWithFlagsDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.getReview(params.reviewId);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listStepCandidates(
        params: ListStepCandidatesUseCase.Params
    ): Promise<StepCandidateDto[]> {
        const appGateway = this.forNamespace(params.target.namespace);
        const envelope = await appGateway.listStepCandidates(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesUseCase.Params
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

    async getStepRun(params: GetStepRunUseCase.Params): Promise<ReviewStepRunInfoDto | null> {
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

    async listReviews(params: ListReviewsUseCase.Params): Promise<ReviewListResultDto> {
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

    async requestReview(params: RequestReviewUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.target.namespace);
        const envelope = await appGateway.requestReview(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async startStep(params: StartReviewStepUseCase.Params): Promise<ReviewDto> {
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

    async takeOverStep(params: TakeOverReviewStepUseCase.Params): Promise<ReviewDto> {
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

    async reassignStep(params: ReassignReviewStepUseCase.Params): Promise<ReviewDto> {
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

    async approveStep(params: ApproveReviewStepUseCase.Params): Promise<ReviewDto> {
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

    async rejectStep(params: RejectReviewStepUseCase.Params): Promise<ReviewDto> {
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

    async cancelReview(params: CancelReviewUseCase.Params): Promise<ReviewDto> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.cancelReview({ reviewId: params.reviewId });
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async restartStep(params: RestartReviewStepUseCase.Params): Promise<ReviewDto> {
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

    async cancelForDelete(params: CancelReviewsForDeleteUseCase.Params): Promise<ReviewDto[]> {
        const appGateway = this.forNamespace(params.namespace);
        const envelope = await appGateway.cancelForDelete(params);
        if (envelope.error || !envelope.data) {
            throw toOperationError(envelope.error);
        }
        return envelope.data;
    }

    async listBlockingReviews(
        params: ListBlockingReviewsUseCase.Params
    ): Promise<BlockingReviewDto[]> {
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
