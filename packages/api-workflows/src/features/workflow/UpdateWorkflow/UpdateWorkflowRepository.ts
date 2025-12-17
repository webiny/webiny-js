import { Result } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { createIdentifier } from "@webiny/utils";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { WorkflowMapper, WorkflowModel } from "~/domain/workflow/abstractions.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { UpdateWorkflowRepository as Repository } from "./abstractions.js";
import type { IUpdateWorkflowInput } from "./abstractions.js";

class UpdateWorkflowRepositoryImpl implements Repository.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private model: WorkflowModel.Interface,
        private mapper: WorkflowMapper.Interface
    ) {}

    async execute(input: IUpdateWorkflowInput): Repository.Return {
        // NOTE: Parse id to extract base id (strip version if present)
        // Original implementation: line 194
        const { id } = parseIdentifier(input.id);

        // NOTE: Map input to CMS entry values
        // Original implementation: line 189-193
        const values = this.mapper.toCmsEntry({
            id,
            app: input.app,
            name: input.name,
            steps: input.steps
        });

        // NOTE: Create workflow ID with version 1
        // Original implementation: line 194-197
        const workflowId = createIdentifier({
            id,
            version: 1
        });

        try {
            // NOTE: Update existing workflow
            // Original implementation: line 198-200
            const updateResult = await this.updateEntry.execute(this.model, workflowId, values);

            if (updateResult.isFail()) {
                return Result.fail(new WorkflowPersistenceError(updateResult.error));
            }

            // NOTE: Return workflow with parsed id
            // Original implementation: line 202-205
            return Result.ok({
                ...values,
                id
            });
        } catch (error) {
            return Result.fail(new WorkflowPersistenceError(error as Error));
        }
    }
}

export const UpdateWorkflowRepository = Repository.createImplementation({
    implementation: UpdateWorkflowRepositoryImpl,
    dependencies: [UpdateEntryUseCase, WorkflowModel, WorkflowMapper]
});
