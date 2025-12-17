import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { WorkflowModel } from "~/domain/workflow/abstractions.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { DeleteWorkflowRepository as Repository } from "./abstractions.js";

class DeleteWorkflowRepositoryImpl implements Repository.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private model: WorkflowModel.Interface
    ) {}

    async execute(input: Repository.Params): Repository.Return {
        // NOTE: Create workflow ID with version 1
        // Original implementation: line 86-89
        const workflowId = createIdentifier({
            id: input.id,
            version: 1
        });

        try {
            // NOTE: Delete entry via CMS (with withoutAuthorization handled by CMS use case)
            // Original implementation: line 90-93
            const result = await this.deleteEntry.execute(this.model, workflowId);

            if (result.isFail()) {
                return Result.fail(new WorkflowPersistenceError(result.error));
            }

            return Result.ok();
        } catch (error) {
            return Result.fail(new WorkflowPersistenceError(error as Error));
        }
    }
}

export const DeleteWorkflowRepository = Repository.createImplementation({
    implementation: DeleteWorkflowRepositoryImpl,
    dependencies: [DeleteEntryUseCase, WorkflowModel]
});
