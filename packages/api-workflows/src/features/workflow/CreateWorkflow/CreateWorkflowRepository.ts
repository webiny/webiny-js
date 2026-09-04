import { Result } from "@webiny/feature/api";
import { parseIdentifier } from "@webiny/utils/parseIdentifier.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import {
    type IWorkflow,
    WorkflowMapper,
    WorkflowModelProvider
} from "~/domain/workflow/abstractions.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { CreateWorkflowRepository as Repository } from "./abstractions.js";

class CreateWorkflowRepositoryImpl implements Repository.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private modelProvider: WorkflowModelProvider.Interface,
        private mapper: WorkflowMapper.Interface
    ) {}

    async execute(input: Repository.Input): Repository.Return {
        const model = await this.modelProvider.get();
        const { id } = parseIdentifier(input.id);

        const values = this.mapper.toCmsEntry({
            id,
            app: input.app,
            name: input.name,
            steps: input.steps
        });
        try {
            const createResult = await this.createEntry.execute<IWorkflow>(model, {
                id,
                values
            });

            if (createResult.isFail()) {
                return Result.fail(new WorkflowPersistenceError(createResult.error));
            }

            return Result.ok({ ...values, id });
        } catch (error) {
            return Result.fail(new WorkflowPersistenceError(error));
        }
    }
}

export const CreateWorkflowRepository = Repository.createImplementation({
    implementation: CreateWorkflowRepositoryImpl,
    dependencies: [CreateEntryUseCase, WorkflowModelProvider, WorkflowMapper]
});
