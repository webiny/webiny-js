import { createFeature } from "@webiny/feature/admin";
import { UpdateWorkflowSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateWorkflowSettingsUseCase } from "./UpdateWorkflowSettingsUseCase.js";

export const UpdateWorkflowSettingsFeature = createFeature({
    name: "Workflows/UpdateWorkflowSettings",
    register(container) {
        container.register(UpdateWorkflowSettingsUseCase);
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
