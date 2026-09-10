import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    PURGE_ACTIVITY_RECORDS_TASK_ID,
    type IPurgeActivityRecordsInput
} from "./PurgeActivityRecordsTaskDefinition.js";

/**
 * Enqueues cleanup when an entry is permanently deleted.
 *
 * `EntryAfterDeleteEvent` with `permanent: true` fires exactly once per entry on every purge path
 * — a manual delete, a bulk purge, and the scheduled auto-purge all route through
 * `DeleteEntryUseCase` one entry at a time — so this is the single hook that catches all three.
 *
 * Deliberately a second handler on the same event rather than folded into the one that records the
 * deletion. Recording and cleanup are independent concerns with independent failure modes, and
 * neither should be able to prevent the other from running.
 *
 * Enqueues rather than deletes. Retention is permanent, so a heavily edited entry can hold
 * thousands of records, and deleting them inline would put an unbounded loop inside a write that
 * has already committed.
 *
 * Like the recorder, this never throws: it runs inside the delete, and a failure to schedule
 * cleanup must not turn a completed deletion into an error. The cost of a dropped enqueue is
 * orphaned records, which is a leak rather than a corruption — and one the trash-bin purge will
 * hit again on any later deletion of the same target.
 */
class PurgeOnEntryDeletedImpl implements EntryAfterDeleteEventHandler.Interface {
    constructor(private taskService: TaskService.Interface) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;

        if (!permanent || model.isPrivate) {
            return;
        }

        try {
            const result = await this.taskService.trigger<IPurgeActivityRecordsInput>({
                definition: PURGE_ACTIVITY_RECORDS_TASK_ID,
                name: `Activity log cleanup for entry ${entry.entryId ?? entry.id}`,
                input: {
                    targetType: "cms-entry",
                    targetId: this.targetIdOf(entry)
                }
            });

            if (result.isFail()) {
                this.reportFailure(entry, result.error);
            }
        } catch (error) {
            this.reportFailure(entry, error);
        }
    }

    private targetIdOf(entry: CmsEntry): string {
        return entry.entryId || parseIdentifier(entry.id).id;
    }

    private reportFailure(entry: CmsEntry, error: unknown): void {
        try {
            console.error(
                `[activity-log] Failed to schedule activity record cleanup for entry ` +
                    `"${entry?.id}". Its records may be orphaned. The deletion itself succeeded.`,
                error
            );
        } catch {
            // Logging must not break the delete either.
        }
    }
}

export const PurgeOnEntryDeleted = EntryAfterDeleteEventHandler.createImplementation({
    implementation: PurgeOnEntryDeletedImpl,
    dependencies: [TaskService]
});
