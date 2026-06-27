import { createFeature } from "@webiny/feature/api";
import { CreateWorkflowStateUseCase } from "./CreateWorkflowStateUseCase.js";
import { CreateWorkflowStateRepository } from "./CreateWorkflowStateRepository.js";
import { DefaultContextProvider } from "./DefaultWorkflowStateContextProvider.js";

export const CreateWorkflowStateFeature = createFeature({
    name: "WorkflowState/CreateWorkflowState",
    register(container) {
        container.register(CreateWorkflowStateRepository).inSingletonScope();
        container.register(DefaultContextProvider);
        container.register(CreateWorkflowStateUseCase);
    }
});
