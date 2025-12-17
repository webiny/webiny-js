import { Result } from "@webiny/feature/api";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { WorkflowStateModel, WorkflowStateMapper } from "~/domain/workflowState/abstractions.js";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import {
    WorkflowStateNotFoundError,
    WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import { GetWorkflowStateRepository as Repository } from "./abstractions.js";

class GetWorkflowStateRepositoryImpl implements Repository.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private model: WorkflowStateModel.Interface,
        private mapper: WorkflowStateMapper.Interface
    ) {}

    async execute(input: Repository.Params): Repository.Return {
        const entryResult = await this.getEntryById.execute<Omit<IWorkflowStateRecord, "id">>(
            this.model,
            input.id
        );

        if (entryResult.isFail()) {
            if (entryResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(
                    new WorkflowStateNotFoundError({
                        id: input.id
                    })
                );
            }

            return Result.fail(new WorkflowStatePersistenceError(entryResult.error));
        }

        const entry = entryResult.value;

        const record = this.mapper.fromCmsEntry(entry);
        return Result.ok(record);
    }
}

export const GetWorkflowStateRepository = Repository.createImplementation({
    implementation: GetWorkflowStateRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, WorkflowStateModel, WorkflowStateMapper]
});
