import type { EditorWorkflow } from "~/editor/domain/types.js";
import { WorkflowEditorRepository } from "~/editor/repository/abstractions.js";
import { GetWorkflowUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetWorkflowUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: WorkflowEditorRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<EditorWorkflow> {
        return this.repository.getWorkflow(params);
    }
}

export const GetWorkflowUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWorkflowUseCaseImpl,
    dependencies: [WorkflowEditorRepository]
});
