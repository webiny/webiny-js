import { createAbstraction } from "@webiny/feature/admin";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { BlockingReviewDto } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewListResultDto } from "./dto.js";
import type { ReviewStepRunInfoDto } from "./dto.js";
import type { ReviewWithFlagsDto } from "./dto.js";
import type { StepCandidateDto } from "./dto.js";
import type { WorkflowDto } from "./dto.js";
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
    getTargetReview(params: GetTargetReviewUseCase.Params): Promise<ReviewWithFlagsDto | null>;
    getReview(params: GetReviewUseCase.Params): Promise<ReviewWithFlagsDto>;
    listStepCandidates(params: ListStepCandidatesUseCase.Params): Promise<StepCandidateDto[]>;
    listReviewStepCandidates(
        params: ListReviewStepCandidatesUseCase.Params
    ): Promise<StepCandidateDto[]>;
    getStepRun(params: GetStepRunUseCase.Params): Promise<ReviewStepRunInfoDto | null>;
    listReviews(params: ListReviewsUseCase.Params): Promise<ReviewListResultDto>;
    requestReview(params: RequestReviewUseCase.Params): Promise<ReviewDto>;
    startStep(params: StartReviewStepUseCase.Params): Promise<ReviewDto>;
    takeOverStep(params: TakeOverReviewStepUseCase.Params): Promise<ReviewDto>;
    reassignStep(params: ReassignReviewStepUseCase.Params): Promise<ReviewDto>;
    approveStep(params: ApproveReviewStepUseCase.Params): Promise<ReviewDto>;
    rejectStep(params: RejectReviewStepUseCase.Params): Promise<ReviewDto>;
    cancelReview(params: CancelReviewUseCase.Params): Promise<ReviewDto>;
    restartStep(params: RestartReviewStepUseCase.Params): Promise<ReviewDto>;
    cancelForDelete(params: CancelReviewsForDeleteUseCase.Params): Promise<ReviewDto[]>;
    listBlockingReviews(params: ListBlockingReviewsUseCase.Params): Promise<BlockingReviewDto[]>;
}

export const ReviewGateway = createAbstraction<IReviewGateway>("Workflows/ReviewGateway");

export namespace ReviewGateway {
    export type Interface = IReviewGateway;
}
