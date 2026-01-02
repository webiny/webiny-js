import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { WorkflowStateModel, WorkflowStateMapper } from "~/domain/workflowState/abstractions.js";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import { WorkflowStatePersistenceError } from "~/domain/workflowState/errors.js";
import { ListWorkflowStatesRepository as Repository } from "./abstractions.js";

class ListWorkflowStatesRepositoryImpl implements Repository.Interface {
    constructor(
        private listEntries: ListLatestEntriesUseCase.Interface,
        private model: WorkflowStateModel.Interface,
        private mapper: WorkflowStateMapper.Interface
    ) {}

    async execute(params: Repository.Params = {}): Repository.Return {
        const listResult = await this.listEntries.execute<Omit<IWorkflowStateRecord, "id">>(
            this.model,
            {
                limit: 50,
                sort: ["createdOn_DESC"],
                ...params,
                where: {
                    ...params.where
                }
            }
        );

        if (listResult.isFail()) {
            return Result.fail(new WorkflowStatePersistenceError(listResult.error));
        }

        const { entries, meta } = listResult.value;

        const records = entries.map(item => this.mapper.fromCmsEntry(item));

        return Result.ok({
            items: records,
            meta
        });
    }
}

export const ListWorkflowStatesRepository = Repository.createImplementation({
    implementation: ListWorkflowStatesRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, WorkflowStateModel, WorkflowStateMapper]
});
