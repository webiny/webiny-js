import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import type { IWorkflowStateRecord } from "~/domain/workflowState/abstractions.js";
import { WorkflowStateMapper, WorkflowStateModel } from "~/domain/workflowState/abstractions.js";
import { WorkflowStatePersistenceError } from "~/domain/workflowState/errors.js";
import { ListWorkflowStatesRepository as Repository } from "./abstractions.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";

class ListWorkflowStatesRepositoryImpl implements Repository.Interface {
    constructor(
        private listEntries: ListLatestEntriesUseCase.Interface,
        private model: WorkflowStateModel.Interface,
        private mapper: WorkflowStateMapper.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface
    ) {}

    async execute(params: Repository.Params = {}): Repository.Return {
        const listResult = await this.listEntries.execute<Omit<IWorkflowStateRecord, "id">>(
            this.model,
            {
                limit: 50,
                sort: ["createdOn_DESC"],
                ...params,
                where: this.cmsWhereMapper.map({
                    input: params.where,
                    fields: this.model.fields
                })
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
    dependencies: [
        ListLatestEntriesUseCase,
        WorkflowStateModel,
        WorkflowStateMapper,
        CmsWhereMapper
    ]
});
