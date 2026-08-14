import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries";
import { CmsWhereMapper } from "@webiny/api-headless-cms/features/whereMapper/abstractions.js";
import { CmsSortMapper } from "@webiny/api-headless-cms/features/sortMapper/abstractions.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import {
    CorrectionModel,
    CorrectionRepository as CorrectionRepositoryAbstraction,
    JobModel,
    JobRepository as JobRepositoryAbstraction,
    ModelCallModel,
    ModelCallRepository as ModelCallRepositoryAbstraction,
    OverrideModel,
    OverrideRepository as OverrideRepositoryAbstraction,
    RunModel,
    RunRepository as RunRepositoryAbstraction,
    type ListMeta,
    type ListParams
} from "~/domain/abstractions.js";
import {
    EntryToCorrectionMapper,
    EntryToJobMapper,
    EntryToModelCallMapper,
    EntryToOverrideMapper,
    EntryToRunMapper
} from "~/domain/mappers.js";
import {
    ExtractionNotFoundError,
    ExtractionPersistenceError,
    ExtractionValidationError,
    type ExtractionError
} from "~/domain/errors.js";
import type {
    CorrectionLogValues,
    JobValues,
    ModelCallValues,
    OverrideValues,
    RunValues,
    StageLedgerEntry
} from "~/domain/types.js";
import { mergeLedgers } from "~/domain/ledger.js";
import { runLedgerKey } from "~/constants.js";

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
        private sortMapper: CmsSortMapper.Interface,
        private ledgerStore: KeyValueStore.Interface
    ) {}

    /**
     * The run's authoritative stage ledger, read strongly-consistently from the KV store. Returns null
     * when no KV ledger exists yet — a run created before the ledger moved off the CMS entry; the caller
     * falls back to the entry's denormalized copy, which the next write promotes into the KV store.
     */
    private async readLedger(id: string): Promise<StageLedgerEntry[] | null> {
        const result = await this.ledgerStore.get<StageLedgerEntry[]>(runLedgerKey(id), {
            consistent: true
        });
        if (result.isFail() || !Array.isArray(result.value)) {
            return null;
        }
        return result.value;
    }

    private async writeLedger(id: string, stages: StageLedgerEntry[]): Promise<void> {
        await this.ledgerStore.set(runLedgerKey(id), stages);
    }

    async create(values: RunValues) {
        const result = await this.createEntry.execute(this.model, { values });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        const run = EntryToRunMapper.toRun(result.value);
        // Seed the ledger's authoritative home (KV) alongside the denormalized copy on the entry.
        await this.writeLedger(run.id, values.stages);
        return Result.ok({ ...run, stages: values.stages });
    }

    async get(id: string) {
        const result = await this.getEntryById.execute(this.model, id);
        if (result.isFail()) {
            if (result.error.code === "Cms/Entry/NotFound") {
                return Result.fail(new ExtractionNotFoundError(id));
            }
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        const run = EntryToRunMapper.toRun(result.value);
        // Read the ledger from its authoritative, strongly-consistent home; fall back to the entry's copy
        // for a legacy run whose ledger hasn't been promoted to KV yet.
        const ledger = await this.readLedger(id);
        return Result.ok(ledger ? { ...run, stages: ledger } : run);
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
        let nextValues = values;
        // Non-regressing ledger write: merge the incoming stages against the stored ones, keeping the
        // more-advanced entry per stage, so a stale writer (a retrying/zombie stage task that read the run
        // before later stages ran) can't clobber completed stages back. The stored copy is read from the
        // KV ledger with STRONG consistency — the eventually-consistent CMS-entry read this merge used
        // before could return a pre-write snapshot, defeating the version guard and letting a stale write
        // win (the "completed stage reverts a few seconds later" bug).
        if (values.stages) {
            const stored = (await this.readLedger(id)) ?? (await this.readEntryStages(id)) ?? [];
            const merged = mergeLedgers(stored, values.stages);
            await this.writeLedger(id, merged);
            nextValues = { ...values, stages: merged };
        }
        const result = await this.updateEntry.execute(this.model, id, { values: nextValues });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        const run = EntryToRunMapper.toRun(result.value);
        return Result.ok(nextValues.stages ? { ...run, stages: nextValues.stages } : run);
    }

    /** Legacy fallback: the denormalized ledger on the CMS entry, for a run predating the KV ledger. */
    private async readEntryStages(id: string): Promise<StageLedgerEntry[] | null> {
        const current = await this.getEntryById.execute(this.model, id);
        if (current.isFail() || !Array.isArray(current.value.values.stages)) {
            return null;
        }
        return current.value.values.stages as StageLedgerEntry[];
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
        CmsSortMapper,
        KeyValueStore
    ]
});

// ----- Overrides (W8.1) --------------------------------------------------------------------------

class OverrideRepositoryImpl implements OverrideRepositoryAbstraction.Interface {
    constructor(
        private model: OverrideModel.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface,
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

    /**
     * Replace any existing override with the same (job, stage, signature, kind) rather than stack a
     * second — re-correcting an item replaces its correction. The kind lives inside the `correction`
     * json (not a filterable field), so the identity match is narrowed by the filterable fields and the
     * kind is compared in memory.
     */
    async upsert(values: OverrideValues) {
        const existing = await this.listByJob(values.jobId);
        if (existing.isOk()) {
            const match = existing.value.find(
                override =>
                    override.stage === values.stage &&
                    override.structuralSignature === values.structuralSignature &&
                    override.correction.kind === values.correction.kind
            );
            if (match) {
                const updated = await this.updateEntry.execute(this.model, match.id, { values });
                if (updated.isFail()) {
                    return Result.fail(toWriteError(updated.error));
                }
                return Result.ok(EntryToOverrideMapper.toOverride(updated.value));
            }
        }
        return this.create(values);
    }

    async delete(id: string) {
        const result = await this.deleteEntry.execute(this.model, id);
        if (result.isFail()) {
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        return Result.ok(undefined);
    }
}

export const OverrideRepository = OverrideRepositoryAbstraction.createImplementation({
    implementation: OverrideRepositoryImpl,
    dependencies: [
        OverrideModel,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase,
        ListLatestEntriesUseCase,
        CmsWhereMapper
    ]
});

// ----- Correction log (W8.2) ---------------------------------------------------------------------

const CORRECTION_LIMIT = 500;

class CorrectionRepositoryImpl implements CorrectionRepositoryAbstraction.Interface {
    constructor(
        private model: CorrectionModel.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface
    ) {}

    async create(values: CorrectionLogValues) {
        const result = await this.createEntry.execute(this.model, { values });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        return Result.ok(EntryToCorrectionMapper.toCorrection(result.value));
    }

    async listByRun(runId: string) {
        const result = await this.listLatestEntries.execute(this.model, {
            where: this.whereMapper.map({ fields: this.model.fields, input: { runId } }),
            limit: CORRECTION_LIMIT,
            after: null
        });
        if (result.isFail()) {
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        return Result.ok(
            result.value.entries.map(entry => EntryToCorrectionMapper.toCorrection(entry))
        );
    }
}

export const CorrectionRepository = CorrectionRepositoryAbstraction.createImplementation({
    implementation: CorrectionRepositoryImpl,
    dependencies: [CorrectionModel, CreateEntryUseCase, ListLatestEntriesUseCase, CmsWhereMapper]
});

// ----- Model calls -------------------------------------------------------------------------------

const MODEL_CALL_LIMIT = 500;

class ModelCallRepositoryImpl implements ModelCallRepositoryAbstraction.Interface {
    constructor(
        private model: ModelCallModel.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private whereMapper: CmsWhereMapper.Interface
    ) {}

    async create(values: ModelCallValues) {
        const result = await this.createEntry.execute(this.model, { values });
        if (result.isFail()) {
            return Result.fail(toWriteError(result.error));
        }
        return Result.ok(EntryToModelCallMapper.toModelCall(result.value));
    }

    async listByRun(
        runId: string,
        params: { stage?: string; stageVersion?: number; limit?: number } = {}
    ) {
        const where: Record<string, unknown> = { runId };
        if (params.stage) {
            where.stage = params.stage;
        }
        if (params.stageVersion !== undefined) {
            where.stageVersion = params.stageVersion;
        }
        const result = await this.listLatestEntries.execute(this.model, {
            where: this.whereMapper.map({ fields: this.model.fields, input: where }),
            limit: params.limit ?? MODEL_CALL_LIMIT,
            after: null
        });
        if (result.isFail()) {
            return Result.fail(new ExtractionPersistenceError(result.error));
        }
        return Result.ok(
            result.value.entries.map(entry => EntryToModelCallMapper.toModelCall(entry))
        );
    }
}

export const ModelCallRepository = ModelCallRepositoryAbstraction.createImplementation({
    implementation: ModelCallRepositoryImpl,
    dependencies: [ModelCallModel, CreateEntryUseCase, ListLatestEntriesUseCase, CmsWhereMapper]
});
