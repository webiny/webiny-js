import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntryListWhereValues } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { AssignmentModelProvider } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
import { AssignmentRepository as Abstraction } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import type { AssignmentRecord, AssignmentRecordValues } from "~/domain/assignment/types.js";
import { forEachWithConcurrency } from "~/domain/forEachWithConcurrency.js";
import { AssignmentEntryMapper, type AssignmentEntryValues } from "./AssignmentEntryMapper.js";

const DEFAULT_LIMIT = 100;
const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";
/** How many records are deleted at once. */
const DELETE_CONCURRENCY = 5;

class AssignmentRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: AssignmentModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async create(
        values: AssignmentRecordValues
    ): Promise<Result<AssignmentRecord, AssignmentPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.createEntry.execute<AssignmentEntryValues>(model, {
            // `createdOn = assignedOn`, so the storage sort on `createdOn` is the `assignedOn`
            // order across pages (A8).
            createdOn: values.assignedOn,
            values: AssignmentEntryMapper.toValues(values)
        });
        if (result.isFail()) {
            return Result.fail(new AssignmentPersistenceError(result.error));
        }
        return Result.ok(AssignmentEntryMapper.fromEntry(result.value));
    }

    async list(
        params: Abstraction.ListParams
    ): Promise<Result<Abstraction.ListResult, AssignmentPersistenceError>> {
        const { where } = params;
        // An empty `In` list throws on OpenSearch (DDB returns nothing): answer without querying.
        if (
            (where.reviewId_in && where.reviewId_in.length === 0) ||
            (where.userId_in && where.userId_in.length === 0) ||
            (where.workflowId_in && where.workflowId_in.length === 0)
        ) {
            return Result.ok({
                items: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
            });
        }
        const model = await this.modelProvider.get();
        const values: CmsEntryListWhereValues = {};
        if (where.reviewId !== undefined) {
            values.reviewId = where.reviewId;
        }
        if (where.reviewId_in !== undefined) {
            values.reviewId_in = [...where.reviewId_in];
        }
        if (where.workflowId !== undefined) {
            values.workflowId = where.workflowId;
        }
        if (where.stepId !== undefined) {
            values.stepId = where.stepId;
        }
        if (where.userId !== undefined) {
            values.userId = where.userId;
        }
        if (where.userId_in !== undefined) {
            values.userId_in = [...where.userId_in];
        }
        if (where.workflowId_in !== undefined) {
            values.workflowId_in = [...where.workflowId_in];
        }
        if (where.kind !== undefined) {
            values.kind = where.kind;
        }

        const result = await this.listLatestEntries.execute<AssignmentEntryValues>(model, {
            where: { values },
            sort: ["createdOn_DESC"],
            limit: params.limit ?? DEFAULT_LIMIT,
            after: params.after ?? null
        });
        if (result.isFail()) {
            return Result.fail(new AssignmentPersistenceError(result.error));
        }

        return Result.ok({
            items: result.value.entries.map(entry => AssignmentEntryMapper.fromEntry(entry)),
            meta: result.value.meta
        });
    }

    async deleteMany(ids: string[]): Promise<Result<void, AssignmentPersistenceError>> {
        const uniqueIds = [...new Set(ids)];
        if (uniqueIds.length === 0) {
            return Result.ok();
        }
        const model = await this.modelProvider.get();
        // One permanent delete per entry, a few at a time. Not `DeleteMultipleEntriesUseCase`:
        // on ddb-es it also deletes the published search record, which these never-published
        // entries do not have, and the test stream processing rejects that delete. Every id is
        // tried; a failure is returned once all are done.
        const failures: AssignmentPersistenceError[] = [];
        await forEachWithConcurrency(uniqueIds, DELETE_CONCURRENCY, async id => {
            const revisionId = createIdentifier({ id, version: 1 });
            const result = await this.deleteEntry.execute(model, revisionId, {
                permanently: true
            });
            if (result.isFail() && result.error.code !== ENTRY_NOT_FOUND) {
                failures.push(new AssignmentPersistenceError(result.error));
            }
        });
        if (failures.length > 0) {
            return Result.fail(failures[0]);
        }
        return Result.ok();
    }
}

export const AssignmentRepository = Abstraction.createImplementation({
    implementation: AssignmentRepositoryImpl,
    dependencies: [
        AssignmentModelProvider,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        DeleteEntryUseCase
    ]
});
