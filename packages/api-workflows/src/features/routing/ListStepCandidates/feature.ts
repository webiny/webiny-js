import { createFeature } from "@webiny/feature/api";
import { ListStepCandidatesUseCase } from "./ListStepCandidatesUseCase.js";

export const ListStepCandidatesFeature = createFeature({
    name: "Workflows/ListStepCandidates",
    register(container) {
        container.register(ListStepCandidatesUseCase);
    }
});
