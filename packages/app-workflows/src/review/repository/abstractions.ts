import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
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
 * The review data of every app (R343, R350): domain values over `ReviewGateway`, and the workflow
 * list cached per app. It never swallows an error.
 */
export interface IReviewRepository {
    // The workflow list of the namespace's app, read once and cached until it is invalidated.
    listWorkflows(namespace: string): Promise<ReviewWorkflow[]>;
    // Drops the app's cached list, also a load in flight; callers already awaiting keep their result.
    invalidateWorkflows(app: WorkflowAppKind): void;
    getTargetReview(params: GetTargetReviewUseCase.Params): Promise<ReviewWithFlags | null>;
    getReview(params: GetReviewUseCase.Params): Promise<ReviewWithFlags>;
    listStepCandidates(params: ListStepCandidatesUseCase.Params): Promise<StepCandidate[]>;
    listReviewStepCandidates(
        params: ListReviewStepCandidatesUseCase.Params
    ): Promise<StepCandidate[]>;
    getStepRun(params: GetStepRunUseCase.Params): Promise<ReviewStepRunInfo | null>;
    listReviews(params: ListReviewsUseCase.Params): Promise<ReviewListPage>;
    requestReview(params: RequestReviewUseCase.Params): Promise<Review>;
    startStep(params: StartReviewStepUseCase.Params): Promise<Review>;
    takeOverStep(params: TakeOverReviewStepUseCase.Params): Promise<Review>;
    reassignStep(params: ReassignReviewStepUseCase.Params): Promise<Review>;
    approveStep(params: ApproveReviewStepUseCase.Params): Promise<Review>;
    rejectStep(params: RejectReviewStepUseCase.Params): Promise<Review>;
    cancelReview(params: CancelReviewUseCase.Params): Promise<Review>;
    restartStep(params: RestartReviewStepUseCase.Params): Promise<Review>;
    cancelForDelete(params: CancelReviewsForDeleteUseCase.Params): Promise<Review[]>;
    listBlockingReviews(params: ListBlockingReviewsUseCase.Params): Promise<BlockingReview[]>;
}

export const ReviewRepository = createAbstraction<IReviewRepository>("Workflows/ReviewRepository");

export namespace ReviewRepository {
    export type Interface = IReviewRepository;
}
