import { createFeature } from "@webiny/feature/admin";
import { ListReviewStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListReviewStepCandidatesUseCase } from "./ListReviewStepCandidatesUseCase.js";

export const ListReviewStepCandidatesFeature = createFeature({
    name: "Workflows/ListReviewStepCandidates",
    register(container) {
        container.register(ListReviewStepCandidatesUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
