import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { DeleteWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

class DeleteWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        return this.repository.deleteWorkflow(params);
    }
}

export const DeleteWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
