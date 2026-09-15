import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import {
    WorkflowStateMapper,
    WorkflowStateModelProvider
} from "~/domain/workflowState/abstractions.js";
import { WorkflowStatePersistenceError } from "~/domain/workflowState/errors.js";
import { CreateWorkflowStateRepository as Repository } from "./abstractions.js";

class CreateWorkflowStateRepositoryImpl implements Repository.Interface {
    constructor(
        private createEntry: CreateEntryUseCase.Interface,
        private modelProvider: WorkflowStateModelProvider.Interface,
        private mapper: WorkflowStateMapper.Interface
    ) {}

    async execute(input: Repository.Input): Repository.Return {
        const model = await this.modelProvider.get();
        try {
            const createResult = await this.createEntry.execute<Repository.Input>(model, {
                values: input
            });

            if (createResult.isFail()) {
                return Result.fail(new WorkflowStatePersistenceError(createResult.error));
            }

            const record = this.mapper.fromCmsEntry(createResult.value);
            return Result.ok(record);
        } catch (error) {
            return Result.fail(new WorkflowStatePersistenceError(error as Error));
        }
    }
}

export const CreateWorkflowStateRepository = Repository.createImplementation({
    implementation: CreateWorkflowStateRepositoryImpl,
    dependencies: [CreateEntryUseCase, WorkflowStateModelProvider, WorkflowStateMapper]
});
