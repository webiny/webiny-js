import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { WorkflowStateModel, WorkflowStateMapper } from "~/domain/workflowState/abstractions.js";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import {
    WorkflowStateNotFoundError,
    WorkflowStatePersistenceError,
    MultipleWorkflowsFoundError
} from "~/domain/workflowState/errors.js";
import { GetTargetWorkflowStateRepository as Repository } from "./abstractions.js";

class GetTargetWorkflowStateRepositoryImpl implements Repository.Interface {
    constructor(
        private listEntries: ListLatestEntriesUseCase.Interface,
        private model: WorkflowStateModel.Interface,
        private mapper: WorkflowStateMapper.Interface
    ) {}

    async execute(input: Repository.Params): Repository.Return {
        const listResult = await this.listEntries.execute<Omit<IWorkflowStateRecord, "id">>(
            this.model,
            {
                where: {
                    app: input.app,
                    targetRevisionId: input.targetRevisionId,
                    isActive: true
                },
                limit: 1
            }
        );

        if (listResult.isFail()) {
            return Result.fail(new WorkflowStatePersistenceError(listResult.error));
        }

        const [items, meta] = listResult.value;

        if (items.length === 0) {
            return Result.fail(
                new WorkflowStateNotFoundError({
                    app: input.app,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        if (meta.totalCount > 1) {
            return Result.fail(
                new MultipleWorkflowsFoundError({
                    app: input.app,
                    targetRevisionId: input.targetRevisionId,
                    items
                })
            );
        }

        const record = this.mapper.fromCmsEntry(items[0]);
        return Result.ok(record);
    }
}

export const GetTargetWorkflowStateRepository = Repository.createImplementation({
    implementation: GetTargetWorkflowStateRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, WorkflowStateModel, WorkflowStateMapper]
});
