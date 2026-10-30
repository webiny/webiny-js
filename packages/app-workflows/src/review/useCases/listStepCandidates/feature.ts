import { createFeature } from "@webiny/feature/admin";
import { ListStepCandidatesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListStepCandidatesUseCase } from "./ListStepCandidatesUseCase.js";

export const ListStepCandidatesFeature = createFeature({
    name: "Workflows/ListStepCandidates",
    register(container) {
        container.register(ListStepCandidatesUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
