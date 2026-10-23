import { createFeature } from "@webiny/feature/admin";
import { ListAiModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAiModelsUseCase } from "./ListAiModelsUseCase.js";

export const ListAiModelsFeature = createFeature({
    name: "Workflows/ListAiModels",
    register(container) {
        container.register(ListAiModelsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
