import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { StoreWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

class StoreWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        return this.repository.storeWorkflow(params);
    }
}

export const StoreWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
