import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import { mapBlockingReview } from "~/review/gateway/mapBlockingReview.js";
import { mapReview } from "~/review/gateway/mapReview.js";
import { mapReviewWithFlags } from "~/review/gateway/mapReviewWithFlags.js";
import { mapStepCandidate } from "~/review/gateway/mapStepCandidate.js";
import { mapStepRunInfo } from "~/review/gateway/mapStepRunInfo.js";
import { mapWorkflow } from "~/review/gateway/mapWorkflow.js";
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
import { ReviewRepository as RepositoryAbstraction } from "./abstractions.js";

const mapWorkflows = (dtos: WorkflowDto[]): ReviewWorkflow[] => {
    return dtos.map(mapWorkflow);
};

/*
 * Maps the routing gateway's DTOs to the domain and caches the workflow list per app (R350). The
 * cache holds the load's promise, so concurrent and later reads of one app share one request. A
 * failed load is forgotten only while it is still the cached one, so a load dropped by
 * `invalidateWorkflows` that settles later never touches the newer one.
 */
class ReviewRepositoryImpl implements RepositoryAbstraction.Interface {
    private workflows = new Map<WorkflowAppKind, Promise<ReviewWorkflow[]>>();

    constructor(private gateway: ReviewGateway.Interface) {}

    async listWorkflows(namespace: string): Promise<ReviewWorkflow[]> {
        const app = this.gateway.getApp(namespace);
        let loading = this.workflows.get(app);
        if (!loading) {
            loading = this.gateway.listWorkflows(app).then(mapWorkflows);
            this.workflows.set(app, loading);
        }

        try {
            return await loading;
        } catch (error) {
            if (this.workflows.get(app) === loading) {
                this.workflows.delete(app);
            }
            throw error;
        }
    }

    invalidateWorkflows(app: WorkflowAppKind): void {
        this.workflows.delete(app);
    }

    async getTargetReview(params: GetTargetReviewUseCase.Params): Promise<ReviewWithFlags | null> {
        const dto = await this.gateway.getTargetReview(params);
        if (!dto) {
            return null;
        }
        return mapReviewWithFlags(dto);
    }

    async getReview(params: GetReviewUseCase.Params): Promise<ReviewWithFlags> {
        const dto = await this.gateway.getReview(params);
        return mapReviewWithFlags(dto);
    }

    async listStepCandidates(params: ListStepCandidatesUseCase.Params): Promise<StepCandidate[]> {
        const dtos = await this.gateway.listStepCandidates(params);
        return dtos.map(mapStepCandidate);
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesUseCase.Params
    ): Promise<StepCandidate[]> {
        const dtos = await this.gateway.listReviewStepCandidates(params);
        return dtos.map(mapStepCandidate);
    }

    async getStepRun(params: GetStepRunUseCase.Params): Promise<ReviewStepRunInfo | null> {
        const dto = await this.gateway.getStepRun(params);
        if (!dto) {
            return null;
        }
        return mapStepRunInfo(dto);
    }

    async listReviews(params: ListReviewsUseCase.Params): Promise<ReviewListPage> {
        const result = await this.gateway.listReviews(params);
        const items = result.data.map(mapReviewWithFlags);
        return { items, meta: result.meta ?? { cursor: null, hasMoreItems: false } };
    }

    async requestReview(params: RequestReviewUseCase.Params): Promise<Review> {
        const dto = await this.gateway.requestReview(params);
        return mapReview(dto);
    }

    async startStep(params: StartReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.startStep(params);
        return mapReview(dto);
    }

    async takeOverStep(params: TakeOverReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.takeOverStep(params);
        return mapReview(dto);
    }

    async reassignStep(params: ReassignReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.reassignStep(params);
        return mapReview(dto);
    }

    async approveStep(params: ApproveReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.approveStep(params);
        return mapReview(dto);
    }

    async rejectStep(params: RejectReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.rejectStep(params);
        return mapReview(dto);
    }

    async cancelReview(params: CancelReviewUseCase.Params): Promise<Review> {
        const dto = await this.gateway.cancelReview(params);
        return mapReview(dto);
    }

    async restartStep(params: RestartReviewStepUseCase.Params): Promise<Review> {
        const dto = await this.gateway.restartStep(params);
        return mapReview(dto);
    }

    async cancelForDelete(params: CancelReviewsForDeleteUseCase.Params): Promise<Review[]> {
        const dtos = await this.gateway.cancelForDelete(params);
        return dtos.map(mapReview);
    }

    async listBlockingReviews(
        params: ListBlockingReviewsUseCase.Params
    ): Promise<BlockingReview[]> {
        const dtos = await this.gateway.listBlockingReviews(params);
        return dtos.map(mapBlockingReview);
    }
}

export const ReviewRepository = RepositoryAbstraction.createImplementation({
    implementation: ReviewRepositoryImpl,
    dependencies: [ReviewGateway]
});
