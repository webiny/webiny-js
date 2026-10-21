import type { WorkflowModelPage } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { ListWorkflowModelsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListWorkflowModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<WorkflowModelPage> {
        return this.repository.listModels(params);
    }
}

export const ListWorkflowModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWorkflowModelsUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
