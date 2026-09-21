import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import { ActivitySummaryConfig } from "./config.js";

export const SWEEP_STALE_VALUES_TASK_ID = "activityLogSweepStaleValues";

export interface ISweepStaleValuesInput {
    /** Carried across continuations so the output reports the whole sweep, not the last chunk. */
    clearedSoFar?: number;
    /**
     * Where the scan had reached when the last run ran out of time.
     *
     * Opaque — minted by storage, never read here. Carrying it is what lets a sweep of a large
     * model finish across continuations instead of rescanning its first pages on every run.
     */
    scanFrom?: string | null;
}

export interface ISweepStaleValuesOutput {
    cleared: number;
}

/** How many records one pass reclaims. Small, because each is a write. */
const BATCH_SIZE = 50;

/**
 * Reclaims transient values whose job never consumed them.
 *
 * `selfCleanup` on the job is a backstop, not a guarantee: it does not fire on a Lambda timeout,
 * and it never fires for a task that is created but whose execution never starts. Neither of those
 * is exotic, and both leave content values on a record with nothing coming for them. This is what
 * actually bounds that.
 *
 * Modelled on the purge task rather than on `EmptyTrashBinTask`, which checks its timeout twice in
 * a row and re-lists the same page inside a `while (true)`. The loop here cannot spin: every
 * iteration either returns or advances the cursor past records it has already examined, and the
 * search is strictly forward from that cursor.
 *
 * **Sweeping a job's values out from under it is harmless**, which is worth knowing because it
 * bounds how careful the threshold has to be. If the sweep lands after the job has read its values,
 * the job writes its summary and the clear is a no-op. If it lands before, the job finds nothing
 * and completes with "no values to summarise". The cost is one lost summary, not a corrupt record —
 * so the threshold is chosen to make that rare rather than impossible.
 */
class SweepStaleValuesTaskHandlerImpl implements TaskHandler.Interface<
    ISweepStaleValuesInput,
    ISweepStaleValuesOutput
> {
    constructor(
        private storage: ActivityLogStorage.Interface,
        private config: ActivitySummaryConfig.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskHandler.RunParams<ISweepStaleValuesInput, ISweepStaleValuesOutput>): Promise<
        TaskDefinition.Result<ISweepStaleValuesInput, ISweepStaleValuesOutput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        let cleared = input.clearedSoFar ?? 0;
        let scanFrom = input.scanFrom ?? null;

        // The stall detection below is load-bearing in a way a test cannot show you: remove it and
        // this suite does not go red, it runs the worker out of memory. A loop that re-reads the
        // same batch forever has no failing assertion to report — which is exactly why the defect
        // it guards against survived in `EmptyTrashBinTask`.
        while (!controller.runtime.isCloseToTimeout()) {
            const writtenBefore = new Date(Date.now() - this.config.sweepThresholdMs).toISOString();

            const found = await this.storage.findStaleValues({
                writtenBefore,
                limit: BATCH_SIZE,
                after: scanFrom
            });

            if (found.isFail()) {
                return controller.response.error(found.error);
            }

            const { records, cursor } = found.value;

            if (records.length > 0) {
                const clearedThisPass = await this.clear(records);
                cleared += clearedThisPass;

                if (clearedThisPass === 0) {
                    // Records qualify but none could be cleared. Advancing past them would abandon
                    // them silently; going round again would re-read the same batch forever, which
                    // is the defect `EmptyTrashBinTask` has. Stop and say so.
                    return controller.response.error({
                        message:
                            `Stalled sweeping activity summary values: ${records.length} record(s) ` +
                            `qualify but none could be cleared.`
                    });
                }
            }

            if (cursor === null) {
                // The end of the data, and the only thing that finishes a sweep. An empty batch is
                // not it: the search has a bound of its own, and treating "found nothing this far
                // in" as "nothing left" is what would make an instance whose jobs silently never
                // run look exactly like one where nothing ever qualified.
                return controller.response.done(`Cleared ${cleared} abandoned value bundle(s).`, {
                    cleared
                });
            }

            scanFrom = cursor;
        }

        // Out of time rather than out of work. The cursor goes with it, so the next run resumes
        // where this one stopped rather than rescanning everything it has already been through.
        return controller.response.continue({ ...input, clearedSoFar: cleared, scanFrom });
    }

    /**
     * Clears one batch, recording why.
     *
     * `abandoned` rather than an empty reason, so a customer instance whose jobs silently never run
     * is distinguishable from one where nothing ever qualified for a summary. Without it both look
     * like a timeline of records with no sentences.
     */
    private async clear(records: { id: string }[]): Promise<number> {
        let cleared = 0;

        for (const record of records) {
            const result = await this.storage.settleSummary({
                recordId: record.id,
                reason: "abandoned"
            });

            if (result.isOk()) {
                cleared++;
            }
        }

        return cleared;
    }
}

const SweepStaleValuesTaskHandler = TaskHandler.createImplementation({
    implementation: SweepStaleValuesTaskHandlerImpl,
    dependencies: [ActivityLogStorage, ActivitySummaryConfig]
});

class SweepStaleValuesTaskImpl implements TaskDefinition.Interface {
    public readonly id = SWEEP_STALE_VALUES_TASK_ID;
    public readonly title = "Activity log - reclaim abandoned summary values";
    public readonly description =
        "Clears content values left on activity records by summary jobs that never ran.";
    public readonly maxIterations = 120;
    public readonly isPrivate = true;
    public readonly databaseLogs = false;
    public readonly selfCleanup = "always" as const;

    handler = SweepStaleValuesTaskHandler;
}

export const SweepStaleValuesTaskDefinition = TaskDefinition.createImplementation({
    implementation: SweepStaleValuesTaskImpl,
    dependencies: []
});
