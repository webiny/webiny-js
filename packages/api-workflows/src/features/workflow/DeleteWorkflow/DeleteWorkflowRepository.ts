import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { DeleteWorkflowRepository as Repository } from "./abstractions.js";

class DeleteWorkflowRepositoryImpl implements Repository.Interface {
    constructor(
        private deleteEntry: DeleteEntryUseCase.Interface,
        private modelProvider: WorkflowModelProvider.Interface
    ) {}

    async execute(input: Repository.Params): Repository.Return {
        const model = await this.modelProvider.get();
        const workflowId = createIdentifier({
            id: input.id,
            version: 1
        });

        try {
            const result = await this.deleteEntry.execute(model, workflowId);

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
    dependencies: [DeleteEntryUseCase, WorkflowModelProvider]
});
