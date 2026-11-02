import type { Container } from "@webiny/di";
import { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import type { TrashUseCaseFakes } from "./createTrashUseCaseFakes.js";

// Registers each fake under its use-case token, in place of the review services feature (R355).
export const registerTrashUseCaseFakes = (container: Container, fakes: TrashUseCaseFakes): void => {
    container.registerInstance(CancelReviewsForDeleteUseCase, fakes.cancelReviewsForDelete);
    container.registerInstance(ListBlockingReviewsUseCase, fakes.listBlockingReviews);
};
