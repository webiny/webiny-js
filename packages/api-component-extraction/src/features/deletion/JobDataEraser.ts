import { createAbstraction, Result } from "@webiny/feature/api";
import {
    createS3,
    DeleteObjectCommand,
    ListObjectsV2Command
} from "@webiny/aws-sdk/client-s3/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { DeleteFileUseCase } from "@webiny/api-file-manager/features/file/DeleteFile/index.js";
import { GetFileUseCase } from "@webiny/api-file-manager/features/file/GetFile/index.js";
import {
    CorrectionRepository,
    JobModelProvider,
    ModelCallModelProvider,
    ModelCallRepository,
    OverrideModelProvider,
    OverrideRepository,
    RunModelProvider,
    type ICmsModelProvider
} from "~/domain/abstractions.js";
import { ExtractionStorageError, type ExtractionError } from "~/domain/errors.js";
import type { StageLedgerEntry } from "~/domain/types.js";
import { assetKey, assetUrlKey } from "~/domain/assets.js";
import { runLockKey } from "~/constants.js";
import { runDataKeys } from "./runDataKeys.js";

/** The blob prefix every run's S3 objects sit under (`S3BlobStore`). */
const runBlobPrefix = (runId: string): string => `component-extraction/${runId}/`;

/** Deletes in parallel batches of this size: fast, without opening hundreds of requests at once. */
const BATCH = 25;

/** A loop that deletes until a listing comes back empty stops here instead of spinning. */
const MAX_ROUNDS = 50;

const inBatches = async <T>(items: T[], fn: (item: T) => Promise<unknown>): Promise<void> => {
    for (let index = 0; index < items.length; index += BATCH) {
        await Promise.all(items.slice(index, index + BATCH).map(fn));
    }
};

const message = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

/** A migrated image the job's runs used: the file, and the index keys that point at it. */
export interface ErasableImage {
    fileId: string;
    sha256s: string[];
    sourceUrls: string[];
}

/**
 * Deletes what component extraction stores for a job, permanently, and checks each kind is gone.
 *
 * The parts only this package knows the shape of: the private CMS records, the run's key-value
 * records (rebuilt by `runDataKeys`, since the store cannot be listed), the run's S3 prefix, and the
 * image index. Deciding WHAT to delete (the sharing checks) is the caller's; this only deletes what it
 * is given and says how much, or why it stopped.
 *
 * The correction log is not deleted: it is the labelled record the extraction is tuned against, and
 * outlives the job that produced it.
 */
export interface IJobDataEraser {
    /** How many model-call records the run has, for the count shown before deleting. */
    countModelCalls(runId: string): Promise<number>;
    /** How many corrections the runs recorded; they stay, and the dialog says so. */
    countCorrections(runIds: string[]): Promise<number>;
    /** The run's key-value records, S3 objects, model calls and entry. */
    eraseRun(run: {
        id: string;
        entryId: string;
        stages: StageLedgerEntry[];
        signatures: string[];
    }): Promise<Result<{ keys: number; blobs: number; modelCalls: number }, ExtractionError>>;
    /** Migrated images: the File Manager file (its S3 object goes with it) and its index keys. */
    eraseImages(images: ErasableImage[]): Promise<Result<number, ExtractionError>>;
    /** File Manager files by id, such as reference images. */
    eraseFiles(fileIds: string[]): Promise<Result<number, ExtractionError>>;
    /** The job's overrides, its run lock and the job entry itself. Last, after its runs. */
    eraseJob(job: { id: string; entryId: string }): Promise<Result<void, ExtractionError>>;
}

export const JobDataEraser = createAbstraction<IJobDataEraser>("ComponentExtraction/JobDataEraser");
export namespace JobDataEraser {
    export type Interface = IJobDataEraser;
}

class JobDataEraserImpl implements IJobDataEraser {
    constructor(
        private jobModel: JobModelProvider.Interface,
        private runModel: RunModelProvider.Interface,
        private modelCallModel: ModelCallModelProvider.Interface,
        private overrideModel: OverrideModelProvider.Interface,
        private modelCalls: ModelCallRepository.Interface,
        private overrides: OverrideRepository.Interface,
        private corrections: CorrectionRepository.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface,
        private getLatest: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface,
        private store: KeyValueStore.Interface,
        private deleteFile: DeleteFileUseCase.Interface,
        private getFile: GetFileUseCase.Interface
    ) {}

    async countModelCalls(runId: string): Promise<number> {
        const listed = await this.modelCalls.listByRun(runId, { limit: 10000 });
        return listed.isOk() ? listed.value.length : 0;
    }

    async countCorrections(runIds: string[]): Promise<number> {
        let total = 0;
        for (const runId of runIds) {
            const listed = await this.corrections.listByRun(runId);
            total += listed.isOk() ? listed.value.length : 0;
        }
        return total;
    }

    async eraseRun(run: {
        id: string;
        entryId: string;
        stages: StageLedgerEntry[];
        signatures: string[];
    }) {
        const keys = runDataKeys({ runId: run.id, stages: run.stages, signatures: run.signatures });
        const failedKeys: string[] = [];
        await inBatches(keys, async key => {
            const deleted = await this.store.delete(key);
            if (deleted.isFail()) {
                failedKeys.push(key);
            }
        });
        if (failedKeys.length > 0) {
            return Result.fail(
                new ExtractionStorageError(
                    "delete the run's records",
                    `${failedKeys.length} of ${keys.length} could not be deleted, first ${failedKeys[0]}`
                )
            );
        }

        const blobs = await this.erasePrefix(runBlobPrefix(run.id));
        if (blobs.isFail()) {
            return Result.fail(blobs.error);
        }

        const modelCalls = await this.eraseModelCalls(run.id);
        if (modelCalls.isFail()) {
            return Result.fail(modelCalls.error);
        }

        const entry = await this.eraseEntry(this.runModel, run.entryId, "the run");
        if (entry.isFail()) {
            return Result.fail(entry.error);
        }

        return Result.ok({ keys: keys.length, blobs: blobs.value, modelCalls: modelCalls.value });
    }

    async eraseImages(images: ErasableImage[]) {
        const files = await this.eraseFiles(images.map(image => image.fileId));
        if (files.isFail()) {
            return files;
        }
        /*
         * The index after the files: an index key pointing at a deleted file is caught by the
         * migration's own existence check, but a file nothing indexes is invisible to it.
         */
        const keys = images.flatMap(image => [
            ...image.sha256s.map(sha => assetKey(sha)),
            ...image.sourceUrls.map(url => assetUrlKey(url))
        ]);
        const failed: string[] = [];
        await inBatches(keys, async key => {
            const deleted = await this.store.delete(key);
            if (deleted.isFail()) {
                failed.push(key);
            }
        });
        if (failed.length > 0) {
            return Result.fail(
                new ExtractionStorageError(
                    "delete the image index",
                    `${failed.length} of ${keys.length} index records could not be deleted`
                )
            );
        }
        return Result.ok(files.value);
    }

    async eraseFiles(fileIds: string[]) {
        const unique = [...new Set(fileIds)];
        await inBatches(unique, id => this.deleteFile.execute(id));
        // Checked by reading back, not by the delete's own answer: a delete that failed because the
        // file was already gone is fine, and one that answered ok but left the file is not.
        const remaining: string[] = [];
        await inBatches(unique, async id => {
            const found = await this.getFile.execute(id);
            if (found.isOk()) {
                remaining.push(id);
            }
        });
        if (remaining.length > 0) {
            return Result.fail(
                new ExtractionStorageError(
                    "delete files",
                    `${remaining.length} of ${unique.length} are still there, first ${remaining[0]}`
                )
            );
        }
        return Result.ok(unique.length);
    }

    async eraseJob(job: { id: string; entryId: string }) {
        for (let round = 0; round < MAX_ROUNDS; round++) {
            const listed = await this.overrides.listByJob(job.id);
            if (listed.isFail()) {
                return Result.fail(listed.error);
            }
            if (listed.value.length === 0) {
                break;
            }
            for (const override of listed.value) {
                const deleted = await this.eraseEntry(
                    this.overrideModel,
                    override.entryId,
                    "an override"
                );
                if (deleted.isFail()) {
                    return Result.fail(deleted.error);
                }
            }
        }

        const lock = await this.store.delete(runLockKey(job.id));
        if (lock.isFail()) {
            return Result.fail(
                new ExtractionStorageError("release the job's run slot", lock.error.message)
            );
        }

        return this.eraseEntry(this.jobModel, job.entryId, "the job");
    }

    /** Every object under the prefix, page by page; done only when a listing comes back empty. */
    private async erasePrefix(prefix: string): Promise<Result<number, ExtractionError>> {
        const bucket = String(process.env.S3_BUCKET);
        let deleted = 0;
        try {
            const s3 = createS3();
            for (let round = 0; round < MAX_ROUNDS; round++) {
                const listed = await s3.send(
                    new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix })
                );
                const keys = (listed.Contents ?? [])
                    .map(object => object.Key)
                    .filter((key): key is string => Boolean(key));
                if (keys.length === 0) {
                    return Result.ok(deleted);
                }
                await inBatches(keys, key =>
                    s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
                );
                deleted += keys.length;
            }
            return Result.fail(
                new ExtractionStorageError(
                    "delete the run's stored files",
                    `objects were still listed under ${prefix} after ${deleted} deletions`
                )
            );
        } catch (error) {
            return Result.fail(
                new ExtractionStorageError("delete the run's stored files", message(error))
            );
        }
    }

    private async eraseModelCalls(runId: string): Promise<Result<number, ExtractionError>> {
        let deleted = 0;
        for (let round = 0; round < MAX_ROUNDS; round++) {
            const listed = await this.modelCalls.listByRun(runId, { limit: 500 });
            if (listed.isFail()) {
                return Result.fail(listed.error);
            }
            if (listed.value.length === 0) {
                return Result.ok(deleted);
            }
            for (const call of listed.value) {
                const erased = await this.eraseEntry(
                    this.modelCallModel,
                    call.entryId,
                    "a model call record"
                );
                if (erased.isFail()) {
                    return Result.fail(erased.error);
                }
                deleted += 1;
            }
        }
        return Result.fail(
            new ExtractionStorageError(
                "delete the run's model calls",
                `records were still listed after ${deleted} deletions`
            )
        );
    }

    /** One CMS entry, permanently, then read back: gone means not found. */
    private async eraseEntry(
        provider: ICmsModelProvider,
        entryId: string,
        what: string
    ): Promise<Result<void, ExtractionError>> {
        const model = await provider.get();
        const deleted = await this.deleteEntry.execute(model, entryId, { permanently: true });
        if (deleted.isFail() && deleted.error.code !== "Cms/Entry/NotFound") {
            return Result.fail(new ExtractionStorageError(`delete ${what}`, deleted.error.message));
        }
        /*
         * Read back including the bin: an entry that went to the bin instead of being deleted is
         * still there. Only "not found" counts as gone; any other failure says nothing either way.
         */
        const found = await this.getLatest.execute(model, { id: entryId });
        if (found.isOk()) {
            return Result.fail(
                new ExtractionStorageError(`delete ${what}`, `${entryId} is still there`)
            );
        }
        if (found.error.code !== "Cms/Entry/NotFound") {
            return Result.fail(
                new ExtractionStorageError(
                    `check ${what} is gone`,
                    `${entryId}: ${found.error.message}`
                )
            );
        }
        return Result.ok(undefined);
    }
}

export const JobDataEraserImplementation = JobDataEraser.createImplementation({
    implementation: JobDataEraserImpl,
    dependencies: [
        JobModelProvider,
        RunModelProvider,
        ModelCallModelProvider,
        OverrideModelProvider,
        ModelCallRepository,
        OverrideRepository,
        CorrectionRepository,
        DeleteEntryUseCase,
        GetLatestRevisionByEntryIdIncludingDeletedUseCase,
        KeyValueStore,
        DeleteFileUseCase,
        GetFileUseCase
    ]
});
