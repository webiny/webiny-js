import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { WorkflowStateModel, WorkflowStateMapper } from "~/domain/workflowState/abstractions.js";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import {
    WorkflowStateNotFoundError,
    WorkflowStatePersistenceError
} from "~/domain/workflowState/errors.js";
import { UpdateWorkflowStateRepository as Repository } from "./abstractions.js";
import type { IUpdateWorkflowStateInput } from "./abstractions.js";

class UpdateWorkflowStateRepositoryImpl implements Repository.Interface {
    constructor(
        private getEntryById: GetEntryByIdUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private model: WorkflowStateModel.Interface,
        private mapper: WorkflowStateMapper.Interface
    ) {}

    async execute(id: string, input: IUpdateWorkflowStateInput): Repository.Return {
        const getResult = await this.getEntryById.execute<Omit<IWorkflowStateRecord, "id">>(
            this.model,
            id
        );

        if (getResult.isFail()) {
            if (getResult.error.code === "Cms/Entry/NotFound") {
                return Result.fail(
                    new WorkflowStateNotFoundError({
                        id
                    })
                );
            }
            return Result.fail(new WorkflowStatePersistenceError(getResult.error));
        }

        const originalRecord = this.mapper.fromCmsEntry(getResult.value);

        const updatedValues = this.mapper.toCmsEntry({
            ...originalRecord,
            ...input
        });

        try {
            const updateResult = await this.updateEntry.execute<Repository.Input>(
                this.model,
                id,
                updatedValues
            );

            if (updateResult.isFail()) {
                return Result.fail(new WorkflowStatePersistenceError(updateResult.error));
            }

            const updatedRecord = this.mapper.fromCmsEntry(updateResult.value);
            return Result.ok(updatedRecord);
        } catch (error) {
            return Result.fail(new WorkflowStatePersistenceError(error as Error));
        }
    }
}

export const UpdateWorkflowStateRepository = Repository.createImplementation({
    implementation: UpdateWorkflowStateRepositoryImpl,
    dependencies: [GetEntryByIdUseCase, UpdateEntryUseCase, WorkflowStateModel, WorkflowStateMapper]
});
