import type { Container } from "@webiny/di";
import { ApproveReviewStepUseCase } from "~/review/useCases/approveReviewStep/abstractions.js";
import { CancelReviewUseCase } from "~/review/useCases/cancelReview/abstractions.js";
import { GetReviewUseCase } from "~/review/useCases/getReview/abstractions.js";
import { GetStepRunUseCase } from "~/review/useCases/getStepRun/abstractions.js";
import { ListReviewStepCandidatesUseCase } from "~/review/useCases/listReviewStepCandidates/abstractions.js";
import { ReassignReviewStepUseCase } from "~/review/useCases/reassignReviewStep/abstractions.js";
import { RejectReviewStepUseCase } from "~/review/useCases/rejectReviewStep/abstractions.js";
import { RestartReviewStepUseCase } from "~/review/useCases/restartReviewStep/abstractions.js";
import { StartReviewStepUseCase } from "~/review/useCases/startReviewStep/abstractions.js";
import { TakeOverReviewStepUseCase } from "~/review/useCases/takeOverReviewStep/abstractions.js";
import type { ReviewUseCaseFakes } from "./createReviewUseCaseFakes.js";

// Registers each fake under its use-case token, in place of the review services feature (R355).
export const registerReviewUseCaseFakes = (
    container: Container,
    fakes: ReviewUseCaseFakes
): void => {
    container.registerInstance(GetReviewUseCase, fakes.getReview);
    container.registerInstance(GetStepRunUseCase, fakes.getStepRun);
    container.registerInstance(ListReviewStepCandidatesUseCase, fakes.listReviewStepCandidates);
    container.registerInstance(StartReviewStepUseCase, fakes.startReviewStep);
    container.registerInstance(TakeOverReviewStepUseCase, fakes.takeOverReviewStep);
    container.registerInstance(ReassignReviewStepUseCase, fakes.reassignReviewStep);
    container.registerInstance(ApproveReviewStepUseCase, fakes.approveReviewStep);
    container.registerInstance(RejectReviewStepUseCase, fakes.rejectReviewStep);
    container.registerInstance(CancelReviewUseCase, fakes.cancelReview);
    container.registerInstance(RestartReviewStepUseCase, fakes.restartReviewStep);
};
