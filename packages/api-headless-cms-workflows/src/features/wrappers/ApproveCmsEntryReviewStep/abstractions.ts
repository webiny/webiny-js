import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import type { CmsEntryReviewGuardService } from "../CmsEntryReviewGuardService/index.js";

export interface ApproveCmsEntryReviewStepInput {
    reviewId: string;
    stepId: string;
    comment?: string | null;
}

export interface IApproveCmsEntryReviewStepUseCaseErrors {
    guard: CmsEntryReviewGuardService.Error;
    approve: ApproveReviewStepUseCase.Error;
}

type UseCaseError =
    IApproveCmsEntryReviewStepUseCaseErrors[keyof IApproveCmsEntryReviewStepUseCaseErrors];

export interface IApproveCmsEntryReviewStepUseCase {
    execute(input: ApproveCmsEntryReviewStepInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Approve the CMS review step the user owns (spec 5.1): read access here, ownership in the engine. */
export const ApproveCmsEntryReviewStepUseCase =
    createAbstraction<IApproveCmsEntryReviewStepUseCase>("ApproveCmsEntryReviewStepUseCase");

export namespace ApproveCmsEntryReviewStepUseCase {
    export type Interface = IApproveCmsEntryReviewStepUseCase;
    export type Input = ApproveCmsEntryReviewStepInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
