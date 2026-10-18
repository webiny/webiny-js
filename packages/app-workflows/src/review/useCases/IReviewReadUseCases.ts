import type { GetStepRunParams } from "~/review/gateway/IReviewGateway.js";
import type { ListReviewStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ListStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";

export interface IReviewReadUseCases {
    getBoundWorkflow(namespace: string): Promise<ReviewWorkflow | null>;
    getTargetReview(target: ReviewTarget): Promise<ReviewWithFlags | null>;
    getReview(reviewId: string): Promise<ReviewWithFlags>;
    listStepCandidates(params: ListStepCandidatesParams): Promise<StepCandidate[]>;
    listReviewStepCandidates(params: ListReviewStepCandidatesParams): Promise<StepCandidate[]>;
    // `null` when the task record is gone (R257); an error envelope throws.
    getStepRun(params: GetStepRunParams): Promise<ReviewStepRunInfo | null>;
}
