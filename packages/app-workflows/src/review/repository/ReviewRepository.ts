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
import { ReviewRepository as RepositoryAbstraction } from "./abstractions.js";
import type { ReviewTarget } from "~/review/domain/types.js";
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

    async getTargetReview(params: ReviewTarget): Promise<ReviewWithFlags | null> {
        const dto = await this.gateway.getTargetReview(params);
        if (!dto) {
            return null;
        }
        return mapReviewWithFlags(dto);
    }

    async getReview(params: GetReviewGatewayParams): Promise<ReviewWithFlags> {
        const dto = await this.gateway.getReview(params);
        return mapReviewWithFlags(dto);
    }

    async listStepCandidates(params: ListStepCandidatesParams): Promise<StepCandidate[]> {
        const dtos = await this.gateway.listStepCandidates(params);
        return dtos.map(mapStepCandidate);
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesGatewayParams
    ): Promise<StepCandidate[]> {
        const dtos = await this.gateway.listReviewStepCandidates(params);
        return dtos.map(mapStepCandidate);
    }

    async getStepRun(params: GetStepRunGatewayParams): Promise<ReviewStepRunInfo | null> {
        const dto = await this.gateway.getStepRun(params);
        if (!dto) {
            return null;
        }
        return mapStepRunInfo(dto);
    }

    async listReviews(params: ListReviewsGatewayParams): Promise<ReviewListPage> {
        const result = await this.gateway.listReviews(params);
        const items = result.data.map(mapReviewWithFlags);
        return { items, meta: result.meta ?? { cursor: null, hasMoreItems: false } };
    }

    async requestReview(params: RequestReviewParams): Promise<Review> {
        const dto = await this.gateway.requestReview(params);
        return mapReview(dto);
    }

    async startStep(params: ReviewStepGatewayParams): Promise<Review> {
        const dto = await this.gateway.startStep(params);
        return mapReview(dto);
    }

    async takeOverStep(params: TakeOverReviewGatewayParams): Promise<Review> {
        const dto = await this.gateway.takeOverStep(params);
        return mapReview(dto);
    }

    async reassignStep(params: ReassignReviewGatewayParams): Promise<Review> {
        const dto = await this.gateway.reassignStep(params);
        return mapReview(dto);
    }

    async approveStep(params: ApproveReviewGatewayParams): Promise<Review> {
        const dto = await this.gateway.approveStep(params);
        return mapReview(dto);
    }

    async rejectStep(params: RejectReviewGatewayParams): Promise<Review> {
        const dto = await this.gateway.rejectStep(params);
        return mapReview(dto);
    }

    async cancelReview(params: CancelReviewGatewayParams): Promise<Review> {
        const dto = await this.gateway.cancelReview(params);
        return mapReview(dto);
    }

    async restartStep(params: ReviewStepGatewayParams): Promise<Review> {
        const dto = await this.gateway.restartStep(params);
        return mapReview(dto);
    }

    async cancelForDelete(params: CancelForDeleteParams): Promise<Review[]> {
        const dtos = await this.gateway.cancelForDelete(params);
        return dtos.map(mapReview);
    }

    async listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]> {
        const dtos = await this.gateway.listBlockingReviews(params);
        return dtos.map(mapBlockingReview);
    }
}

export const ReviewRepository = RepositoryAbstraction.createImplementation({
    implementation: ReviewRepositoryImpl,
    dependencies: [ReviewGateway]
});
