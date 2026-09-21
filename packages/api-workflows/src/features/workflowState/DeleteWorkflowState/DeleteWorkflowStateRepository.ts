import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { WorkflowStateModelProvider } from "~/domain/workflowState/abstractions.js";
import { DeleteWorkflowStateRepository as Repository } from "./abstractions.js";

class DeleteWorkflowStateRepositoryImpl implements Repository.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private modelProvider: WorkflowStateModelProvider.Interface
    ) {}

    async execute(id: string): Repository.Return {
        const model = await this.modelProvider.get();
        await this.deleteEntry.execute(model, id);

        return Result.ok();
    }
}

export const DeleteWorkflowStateRepository = Repository.createImplementation({
    implementation: DeleteWorkflowStateRepositoryImpl,
    dependencies: [DeleteEntryUseCase, WorkflowStateModelProvider]
});
