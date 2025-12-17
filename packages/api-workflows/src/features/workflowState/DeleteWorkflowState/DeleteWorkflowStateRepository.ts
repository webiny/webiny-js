import { Result } from "@webiny/feature/api";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { WorkflowStateModel } from "~/domain/workflowState/abstractions.js";
import { DeleteWorkflowStateRepository as Repository } from "./abstractions.js";

class DeleteWorkflowStateRepositoryImpl implements Repository.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private model: WorkflowStateModel.Interface
    ) {}

    async execute(id: string): Repository.Return {
        await this.deleteEntry.execute(this.model, id);

        return Result.ok();
    }
}

export const DeleteWorkflowStateRepository = Repository.createImplementation({
    implementation: DeleteWorkflowStateRepositoryImpl,
    dependencies: [DeleteEntryUseCase, WorkflowStateModel]
});
