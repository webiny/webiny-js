import { Result } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { createIdentifier } from "@webiny/utils";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { type IWorkflow, WorkflowMapper, WorkflowModel } from "~/domain/workflow/abstractions.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { IUpdateWorkflowInput } from "./abstractions.js";
import { UpdateWorkflowRepository as Repository } from "./abstractions.js";

class UpdateWorkflowRepositoryImpl implements Repository.Interface {
    constructor(
        private updateEntry: UpdateEntryUseCase.Interface,
        private model: WorkflowModel.Interface,
        private mapper: WorkflowMapper.Interface
    ) {}

    async execute(input: IUpdateWorkflowInput): Repository.Return {
        const { id } = parseIdentifier(input.id);

        const values = this.mapper.toCmsEntry({
            id,
            app: input.app,
            name: input.name,
            steps: input.steps
        });

        const workflowId = createIdentifier({
            id,
            version: 1
        });

        try {
            const updateResult = await this.updateEntry.execute<IWorkflow>(this.model, workflowId, {
                values
            });

            if (updateResult.isFail()) {
                return Result.fail(new WorkflowPersistenceError(updateResult.error));
            }

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
