import { Result } from "@webiny/feature/api";
import type { CmsEntryListWhereValues } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { DeleteMultipleEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { AssignmentModelProvider } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
import { AssignmentRepository as Abstraction } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import type { AssignmentRecord, AssignmentRecordValues } from "~/domain/assignment/types.js";
import { toChunks } from "~/domain/toChunks.js";
import { AssignmentEntryMapper, type AssignmentEntryValues } from "./AssignmentEntryMapper.js";

const DEFAULT_LIMIT = 100;
/** The most entries one `DeleteMultipleEntriesUseCase` call deletes. */
const DELETE_MULTIPLE_LIMIT = 50;

class AssignmentRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: AssignmentModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private deleteMultipleEntries: DeleteMultipleEntriesUseCase.Interface
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
        // Deletes permanently (every revision); ids that are not found are skipped. The model is
        // private, so its access checks pass and the workflows hooks ignore its events.
        for (const chunk of toChunks(uniqueIds, DELETE_MULTIPLE_LIMIT)) {
            // oxlint-disable-next-line no-await-in-loop -- one delete-multiple call per chunk of the CMS limit.
            const result = await this.deleteMultipleEntries.execute(model, { entries: chunk });
            if (result.isFail()) {
                return Result.fail(new AssignmentPersistenceError(result.error));
            }
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
        DeleteMultipleEntriesUseCase
    ]
});
