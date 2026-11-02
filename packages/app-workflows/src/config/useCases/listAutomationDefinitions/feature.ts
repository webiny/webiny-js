import { createFeature } from "@webiny/feature/admin";
import { ListAutomationDefinitionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAutomationDefinitionsUseCase } from "./ListAutomationDefinitionsUseCase.js";

export const ListAutomationDefinitionsFeature = createFeature({
    name: "Workflows/ListAutomationDefinitions",
    register(container) {
        container.register(ListAutomationDefinitionsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
