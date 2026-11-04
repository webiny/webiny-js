import { createFeature } from "@webiny/feature/admin";
import { ListAiToolsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAiToolsUseCase } from "./ListAiToolsUseCase.js";

export const ListAiToolsFeature = createFeature({
    name: "Workflows/ListAiTools",
    register(container) {
        container.register(ListAiToolsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
