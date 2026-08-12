import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import { CmsSortMapper } from "@webiny/api-headless-cms/features/sortMapper/abstractions.js";
import {
    JobModel,
    JobRepository as JobRepositoryAbstraction,
    OverrideModel,
    OverrideRepository as OverrideRepositoryAbstraction,
    RunModel,
    RunRepository as RunRepositoryAbstraction,
    type ListMeta,
    type ListParams
} from "~/domain/abstractions.js";
import { EntryToJobMapper, EntryToOverrideMapper, EntryToRunMapper } from "~/domain/mappers.js";
import {
    ExtractionNotFoundError,
    ExtractionPersistenceError,
    ExtractionValidationError,
    type ExtractionError
} from "~/domain/errors.js";
import type { JobValues, OverrideValues, RunValues } from "~/domain/types.js";

const DEFAULT_LIMIT = 50;

const toMeta = (meta: {
    cursor?: string | null;
    totalCount?: number;
    hasMoreItems?: boolean;
}): ListMeta => ({
    cursor: meta?.cursor ?? null,
    totalCount: meta?.totalCount ?? 0,
    hasMoreItems: meta?.hasMoreItems ?? false
});

/** A CMS write failure is a validation error the user can fix, or an opaque persistence failure. */
const toWriteError = (error: { code: string; message: string }): ExtractionError =>
    error.code === "Cms/Entry/ValidationError"
        ? new ExtractionValidationError(error.message)
        : new ExtractionPersistenceError(error);

// ----- Jobs --------------------------------------------------------------------------------------

class JobRepositoryImpl implements JobRepositoryAbstraction.Interface {
    constructor(
        private model: JobModel.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface,
        private sortMapper: CmsSortMapper.Interface
    ) {}

    async create(values: JobValues) {
        const result = await this.createEntry.execute(this.model, { values });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        return Result.ok(EntryToJobMapper.toJob(result.value));
    }

    async get(id: string) {
        const result = await this.getEntryById.execute(this.model, id);
        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ExtractionNotFoundError(id));
            }
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        return Result.ok(EntryToJobMapper.toJob(result.value));
    }

    async list(params: ListParams = {}) {
        const result = await this.listLatestEntries.execute(this.model, {
            where: this.whereMapper.map({ fields: this.model.fields, input: params.where ?? {} }),
            sort: this.sortMapper.map({
                fields: this.model.fields,
                input: params.sort ?? ["savedOn_DESC"]
            }),
            limit: params.limit ?? DEFAULT_LIMIT,
            after: params.after ?? null,
            search: params.search
        });
        if (result.isFail()) {
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        return Result.ok({
            jobs: result.value.entries.map(entry => EntryToJobMapper.toJob(entry)),
            meta: toMeta(result.value.meta)
        });
    }

    async update(id: string, values: Partial<JobValues>) {
        const result = await this.updateEntry.execute(this.model, id, { values });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        return Result.ok(EntryToJobMapper.toJob(result.value));
    }
}

export const JobRepository = JobRepositoryAbstraction.createImplementation({
    implementation: JobRepositoryImpl,
    dependencies: [
        JobModel,
        CreateEntryUseCase,
        GetEntryByIdUseCase,
        UpdateEntryUseCase,
        ListLatestEntriesUseCase,
        CmsWhereMapper,
        CmsSortMapper
    ]
});

// ----- Runs --------------------------------------------------------------------------------------

class RunRepositoryImpl implements RunRepositoryAbstraction.Interface {
    constructor(
        private model: RunModel.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface,
        private sortMapper: CmsSortMapper.Interface
    ) {}

    async create(values: RunValues) {
        const result = await this.createEntry.execute(this.model, { values });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        return Result.ok(EntryToRunMapper.toRun(result.value));
    }

    async get(id: string) {
        const result = await this.getEntryById.execute(this.model, id);
        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ExtractionNotFoundError(id));
            }
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        return Result.ok(EntryToRunMapper.toRun(result.value));
    }

    async listByJob(jobId: string, params: ListParams = {}) {
        const result = await this.listLatestEntries.execute(this.model, {
            where: this.whereMapper.map({
                fields: this.model.fields,
                input: { ...(params.where ?? {}), jobId }
            }),
            sort: this.sortMapper.map({
                fields: this.model.fields,
                input: params.sort ?? ["createdOn_DESC"]
            }),
            limit: params.limit ?? DEFAULT_LIMIT,
            after: params.after ?? null,
            search: params.search
        });
        if (result.isFail()) {
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        return Result.ok({
            runs: result.value.entries.map(entry => EntryToRunMapper.toRun(entry)),
            meta: toMeta(result.value.meta)
        });
    }

    async update(id: string, values: Partial<RunValues>) {
        const result = await this.updateEntry.execute(this.model, id, { values });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        return Result.ok(EntryToRunMapper.toRun(result.value));
    }
}

export const RunRepository = RunRepositoryAbstraction.createImplementation({
    implementation: RunRepositoryImpl,
    dependencies: [
        RunModel,
        CreateEntryUseCase,
        GetEntryByIdUseCase,
        UpdateEntryUseCase,
        ListLatestEntriesUseCase,
        CmsWhereMapper,
        CmsSortMapper
    ]
});

// ----- Overrides (defined in phase 1, not yet populated) -----------------------------------------

class OverrideRepositoryImpl implements OverrideRepositoryAbstraction.Interface {
    constructor(
        private model: OverrideModel.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface
    ) {}

    async create(values: OverrideValues) {
        const result = await this.createEntry.execute(this.model, { values });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        return Result.ok(EntryToOverrideMapper.toOverride(result.value));
    }

    async listByJob(jobId: string) {
        const result = await this.listLatestEntries.execute(this.model, {
            where: this.whereMapper.map({ fields: this.model.fields, input: { jobId } }),
            limit: 200,
            after: null
        });
        if (result.isFail()) {
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        return Result.ok(
            result.value.entries.map(entry => EntryToOverrideMapper.toOverride(entry))
        );
    }
}

export const OverrideRepository = OverrideRepositoryAbstraction.createImplementation({
    implementation: OverrideRepositoryImpl,
    dependencies: [OverrideModel, CreateEntryUseCase, ListLatestEntriesUseCase, CmsWhereMapper]
});
