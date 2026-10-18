import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { ApproveReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { CancelForDeleteParams } from "~/review/gateway/IReviewGateway.js";
import type { CancelReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { GetStepRunParams } from "~/review/gateway/IReviewGateway.js";
import type { IReviewGateway } from "~/review/gateway/IReviewGateway.js";
import type { ListBlockingReviewsParams } from "~/review/gateway/IReviewGateway.js";
import type { ListReviewsParams } from "~/review/gateway/IReviewGateway.js";
import type { ListReviewStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ListStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ReassignReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RejectReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RequestReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewStepRef } from "~/review/gateway/IReviewGateway.js";
import type { TakeOverReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { IReviewUseCases } from "./IReviewUseCases.js";
import type { ReviewListPage } from "./IReviewListUseCases.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import { mapBlockingReview } from "~/review/gateway/mapBlockingReview.js";
import { mapReview } from "~/review/gateway/mapReview.js";
import { mapReviewWithFlags } from "~/review/gateway/mapReviewWithFlags.js";
import { mapStepCandidate } from "~/review/gateway/mapStepCandidate.js";
import { mapStepRunInfo } from "~/review/gateway/mapStepRunInfo.js";
import { mapWorkflow } from "~/review/gateway/mapWorkflow.js";

const FALLBACK_MESSAGE = "The request failed.";

/*
 * The one shared implementation of the review use cases (R202). It runs the app's gateway, turns
 * an error envelope into a thrown `GraphQLOperationError` (R204, A81), lets transport errors pass
 * and caches the workflow list per instance (A74), so each app, which registers its own instance,
 * has its own cache.
 */
export class ReviewUseCases implements IReviewUseCases {
    private workflows: Promise<ReviewWorkflow[]> | null = null;

    constructor(private gateway: IReviewGateway) {}

    public async getBoundWorkflow(namespace: string): Promise<ReviewWorkflow | null> {
        const loading =
            this.workflows ??
            this.gateway.listWorkflows().then(envelope => {
                if (envelope.error || !envelope.data) {
                    throw new GraphQLOperationError({
                        message: envelope.error?.message ?? FALLBACK_MESSAGE,
                        code: envelope.error?.code ?? null,
                        data: envelope.error?.data ?? null
                    });
                }
                return envelope.data.map(mapWorkflow);
            });
        this.workflows = loading;

        try {
            const workflows = await loading;
            return workflows.find(workflow => workflow.namespaces.includes(namespace)) ?? null;
        } catch (error) {
            if (this.workflows === loading) {
                this.workflows = null;
            }
            throw error;
        }
    }

    /*
     * The cache is the promise itself, so clearing it drops a pending load as well. Callers that
     * already await that load keep its result; `getBoundWorkflow` clears the cache after a failure
     * only when it still holds the failing promise, so a dropped load that settles later never
     * touches the newer one.
     */
    public invalidateWorkflows(): void {
        this.workflows = null;
    }

    public async getTargetReview(target: ReviewTarget): Promise<ReviewWithFlags | null> {
        const envelope = await this.gateway.getTargetReview(target);
        if (envelope.error) {
            throw new GraphQLOperationError({
                message: envelope.error.message ?? FALLBACK_MESSAGE,
                code: envelope.error.code,
                data: envelope.error.data
            });
        }
        if (!envelope.data) {
            return null;
        }
        return mapReviewWithFlags(envelope.data);
    }

    public async getReview(reviewId: string): Promise<ReviewWithFlags> {
        const envelope = await this.gateway.getReview(reviewId);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReviewWithFlags(envelope.data);
    }

    public async listStepCandidates(params: ListStepCandidatesParams): Promise<StepCandidate[]> {
        const envelope = await this.gateway.listStepCandidates(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return envelope.data.map(mapStepCandidate);
    }

    public async listReviewStepCandidates(
        params: ListReviewStepCandidatesParams
    ): Promise<StepCandidate[]> {
        const envelope = await this.gateway.listReviewStepCandidates(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return envelope.data.map(mapStepCandidate);
    }

    public async getStepRun(params: GetStepRunParams): Promise<ReviewStepRunInfo | null> {
        const envelope = await this.gateway.getStepRun(params);
        if (envelope.error) {
            throw new GraphQLOperationError({
                message: envelope.error.message ?? FALLBACK_MESSAGE,
                code: envelope.error.code,
                data: envelope.error.data
            });
        }
        if (!envelope.data) {
            return null;
        }
        return mapStepRunInfo(envelope.data);
    }

    public async listReviews(params: ListReviewsParams): Promise<ReviewListPage> {
        const envelope = await this.gateway.listReviews(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return {
            items: envelope.data.map(mapReviewWithFlags),
            meta: envelope.meta ?? { cursor: null, hasMoreItems: false }
        };
    }

    public async requestReview(params: RequestReviewParams): Promise<Review> {
        const envelope = await this.gateway.requestReview(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async startStep(params: ReviewStepRef): Promise<Review> {
        const envelope = await this.gateway.startStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async takeOverStep(params: TakeOverReviewParams): Promise<Review> {
        const envelope = await this.gateway.takeOverStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async reassignStep(params: ReassignReviewParams): Promise<Review> {
        const envelope = await this.gateway.reassignStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async approveStep(params: ApproveReviewParams): Promise<Review> {
        const envelope = await this.gateway.approveStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async rejectStep(params: RejectReviewParams): Promise<Review> {
        const envelope = await this.gateway.rejectStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async cancelReview(params: CancelReviewParams): Promise<Review> {
        const envelope = await this.gateway.cancelReview(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async restartStep(params: ReviewStepRef): Promise<Review> {
        const envelope = await this.gateway.restartStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async cancelForDelete(params: CancelForDeleteParams): Promise<Review[]> {
        const envelope = await this.gateway.cancelForDelete(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return envelope.data.map(mapReview);
    }

    public async listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]> {
        const envelope = await this.gateway.listBlockingReviews(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return envelope.data.map(mapBlockingReview);
    }
}
