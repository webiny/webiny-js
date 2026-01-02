import { Result } from "@webiny/feature/api";
import { createIdentifier, parseIdentifier } from "@webiny/utils";
import { type IWorkflow, WorkflowMapper, WorkflowModel } from "~/domain/workflow/abstractions.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { ListWorkflowsRepository as Repository, type IListWorkflowsWhere } from "./abstractions.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";

class ListWorkflowsRepositoryImpl implements Repository.Interface {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private model: WorkflowModel.Interface,
        private mapper: WorkflowMapper.Interface
    ) {}

    async execute(input: Repository.Params): Repository.Return {
        const where = {
            ...this.convertListWhere(input.where)
        };

        const listResult = await this.listLatestEntries.execute<IWorkflow>(this.model, {
            sort: ["createdOn_ASC"],
            limit: 100,
            ...input,
            where
        });

        if (listResult.isFail()) {
            return Result.fail(new WorkflowPersistenceError(listResult.error));
        }

        const { entries, meta } = listResult.value;

        const items = entries.map(entry => this.mapper.fromCmsEntry(entry));

        return Result.ok({
            items,
            meta
        });
    }

    private convertListWhere(input?: IListWorkflowsWhere): IListWorkflowsWhere | undefined {
        if (!input || Object.keys(input).length === 0) {
            return undefined;
        }
        const where = structuredClone(input);
        if (where.id) {
            where.id = this.convertWorkflowId(where.id);
        }
        if (where.id_in) {
            where.id_in = where.id_in.map(id => this.convertWorkflowId(id));
        }
        return where;
    }

    private convertWorkflowId(input: string): string {
        const { id } = parseIdentifier(input);
        return createIdentifier({
            id,
            version: 1
        });
    }
}

export const ListWorkflowsRepository = Repository.createImplementation({
    implementation: ListWorkflowsRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, WorkflowModel, WorkflowMapper]
});
