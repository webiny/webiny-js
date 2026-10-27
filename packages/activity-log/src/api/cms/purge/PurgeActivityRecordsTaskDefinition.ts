import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ActivityLogStorage } from "~/api/core/abstractions.js";
import type { ActivityTargetType } from "~/api/core/types.js";

export const PURGE_ACTIVITY_RECORDS_TASK_ID = "activityLogPurgeTargetRecords";

export interface IPurgeActivityRecordsInput {
    targetType: ActivityTargetType;
    targetId: string;
    /** Carried across continuations so the output can report the whole job, not the last chunk. */
    deletedSoFar?: number;
}

export interface IPurgeActivityRecordsOutput {
    deleted: number;
}

/**
 * What the purge actually does.
 *
 * Split from the definition below because a task is now metadata plus a handler class: the runner
 * builds every registered definition to find one by id, and only the winner's handler. Anything
 * that costs something to construct — here, storage — therefore belongs on this half.
 *
 * `EmptyTrashBinTaskDefinition` is the structural model: continuable, with timeout checks and
 * `response.continue(...)`. It is not copied. Two things it gets wrong are avoided here:
 *
 *   - **It checks `isCloseToTimeout()` twice in a row**, identically, which does nothing.
 *   - **Its inner `while (true)` re-lists the same first page with no cursor** and exits only on
 *     an empty count, so it converges only because each pass deletes what it just read. A
 *     persistently failing delete makes it spin until the timeout check breaks it, every
 *     iteration, with the tenant never marked done.
 *
 * This loop cannot spin: every iteration either finishes, makes measurable progress, or returns.
 * A chunk that deletes nothing while reporting work remaining is treated as a stall and reported
 * as an error rather than retried forever.
 */
class PurgeActivityRecordsTaskHandlerImpl implements TaskHandler.Interface<
    IPurgeActivityRecordsInput,
    IPurgeActivityRecordsOutput
> {
    constructor(private storage: ActivityLogStorage.Interface) {}

    async run(
        params: TaskHandler.RunParams<IPurgeActivityRecordsInput, IPurgeActivityRecordsOutput>
    ): Promise<TaskDefinition.Result<IPurgeActivityRecordsInput, IPurgeActivityRecordsOutput>> {
        const { input, controller } = params;

        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const target = { type: input.targetType, id: input.targetId };
        let deleted = input.deletedSoFar ?? 0;

        while (!controller.runtime.isCloseToTimeout()) {
            const result = await this.storage.deleteAllForTarget(target);

            if (result.isFail()) {
                return controller.response.error(result.error);
            }

            deleted += result.value.deleted;

            if (result.value.finished) {
                return controller.response.done(
                    `Removed ${deleted} activity record(s) for ${target.type} "${target.id}".`,
                    { deleted }
                );
            }

            if (result.value.deleted === 0) {
                // Work remains but nothing was removed. Retrying would be the spin that
                // EmptyTrashBinTaskDefinition falls into, so stop and say so.
                return controller.response.error(
                    new Error(
                        `Stalled removing activity records for ${target.type} "${target.id}": ` +
                            `records remain but none could be deleted.`
                    )
                );
            }
        }

        return controller.response.continue({ ...input, deletedSoFar: deleted });
    }
}

const PurgeActivityRecordsTaskHandler = TaskHandler.createImplementation({
    implementation: PurgeActivityRecordsTaskHandlerImpl,
    dependencies: [ActivityLogStorage]
});

/**
 * Removes a permanently deleted target's records.
 *
 * A background task rather than inline in the after-delete handler. The established pattern for
 * cleaning up after a purged entry *is* inline and best-effort — workflows and the scheduler both
 * list related records with `limit: 10000`, loop, and swallow errors — but that shape assumes a
 * handful of related records. Retention here is permanent and records accumulate per save across
 * every entry, so the assumption does not hold and the pattern is deliberately declined.
 */
class PurgeActivityRecordsTaskImpl implements TaskDefinition.Interface {
    public readonly id = PURGE_ACTIVITY_RECORDS_TASK_ID;
    public readonly title = "Activity log - remove records for a deleted target";
    public readonly description =
        "Deletes the activity records belonging to a permanently deleted target.";
    public readonly maxIterations = 120;
    public readonly isPrivate = true;
    public readonly databaseLogs = false;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    handler = PurgeActivityRecordsTaskHandler;
}

export const PurgeActivityRecordsTaskDefinition = TaskDefinition.createImplementation({
    implementation: PurgeActivityRecordsTaskImpl,
    dependencies: []
});
