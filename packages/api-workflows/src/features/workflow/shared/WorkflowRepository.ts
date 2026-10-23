import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions/WorkflowModelProvider.js";
import { WorkflowRepository as Abstraction } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";
import { WorkflowEntryMapper, type WorkflowEntryValues } from "./WorkflowEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

class WorkflowRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: WorkflowModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async get(
        id: string
    ): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<WorkflowEntryValues>(
            model,
            createIdentifier({ id, version: 1 })
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async list(
        params: Abstraction.ListParams
    ): Promise<Result<Abstraction.ListResult, WorkflowPersistenceError>> {
        // An empty `In` list throws on OpenSearch (DDB returns nothing): answer without querying.
        if (params.where?.models_in && params.where.models_in.length === 0) {
            return Result.ok({
                items: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            });
        }
        const model = await this.modelProvider.get();
        const where: CmsEntryListWhere | undefined = params.where?.models_in?.length
            ? { values: { models_in: params.where.models_in } }
            : undefined;

        const result = await this.listLatestEntries.execute<WorkflowEntryValues>(model, {
            where,
            sort: ["createdOn_ASC"],
            limit: params.limit ?? 100,
            after: params.after ?? null
        });
        if (result.isFail()) {
            return Result.fail(new WorkflowPersistenceError(result.error));
        }

        return Result.ok({
            items: result.value.entries.map(entry => WorkflowEntryMapper.fromEntry(entry)),
            meta: result.value.meta
        });
    }

    async create(values: WorkflowValues): Promise<Result<Workflow, WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.createEntry.execute<WorkflowEntryValues>(model, {
            id: values.id,
            values: WorkflowEntryMapper.toValues(values)
        });
        if (result.isFail()) {
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async update(
        values: WorkflowValues
    ): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.updateEntry.execute<WorkflowEntryValues>(
            model,
            createIdentifier({ id: values.id, version: 1 }),
            { values: WorkflowEntryMapper.toValues(values) }
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id: values.id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async delete(
        id: string
    ): Promise<Result<void, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.deleteEntry.execute(model, createIdentifier({ id, version: 1 }), {
            permanently: true
        });
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok();
    }
}

export const WorkflowRepository = Abstraction.createImplementation({
    implementation: WorkflowRepositoryImpl,
    dependencies: [
        WorkflowModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase
    ]
});
