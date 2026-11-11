import { createFeature } from "@webiny/feature/admin";
import { GetWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWorkflowSettingsUseCase } from "./GetWorkflowSettingsUseCase.js";

export const GetWorkflowSettingsFeature = createFeature({
    name: "Workflows/GetWorkflowSettings",
    register(container) {
        container.register(GetWorkflowSettingsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
