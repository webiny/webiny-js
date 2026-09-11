import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { diffValues } from "~/core/diff/diffValues.js";
import type { ChangesetEntry } from "~/core/types.js";
import { modelToFieldDescriptors } from "~/cms/model/toFieldDescriptors.js";
import {
    ActivityWriter,
    EntryActivityRecorder as Abstraction,
    type IRecordEntryActivityParams
} from "./abstractions.js";

/**
 * Turns an entry write into a record: the private-model filter, the diff, and the target identity.
 *
 * Actor resolution, source labelling, correlation ids, persistence and failure containment all
 * live in `ActivityWriter`, shared with the review recorder. This class owns only what is specific
 * to entries.
 *
 * `record` still never throws. The diff and the filter run inside a `try` of their own, because
 * they happen before the writer is reached and a malformed model must not escape either.
 */
class EntryActivityRecorderImpl implements Abstraction.Interface {
    constructor(private writer: ActivityWriter.Interface) {}

    async record(params: IRecordEntryActivityParams): Promise<void> {
        try {
            const { model, entry, action, original, correlationId } = params;

            // Core features store their own data as entries in private models — background tasks
            // and their logs, folders, record locks, scheduled actions, languages, and crucially
            // `wbyWorkflowState` and this feature's own activity records.
            //
            // ┌─ This filter is load-bearing for more than noise reduction ─────────────────────┐
            // │ Without it the activity log records its own writes, and each record's write     │
            // │ produces another record: unbounded recursion inside an entry save. It also      │
            // │ stops a workflow state save being recorded as ordinary entry activity, which    │
            // │ would double-report every review transition already captured from APW's own     │
            // │ events. Do not narrow it without reading the recursion test that guards it.     │
            // └─────────────────────────────────────────────────────────────────────────────────┘
            if (model.isPrivate) {
                return;
            }

            const { changeset, truncated } = this.buildChangeset(model, original, entry);

            await this.writer.write({
                targetId: this.targetIdOf(entry),
                revision: entry.id,
                action,
                correlationId,
                changeset,
                truncated
            });
        } catch (error) {
            try {
                console.error(
                    `[activity-log] Failed to prepare "${params.action}" for entry ` +
                        `"${params.entry?.id}". The write itself was not affected.`,
                    error
                );
            } catch {
                // Logging must not break the write either.
            }
        }
    }

    /**
     * An event without an `original` is not a silent "everything changed" — a publish, an
     * unpublish, a move or a trashing changes no field values, and the honest changeset for those
     * is empty. Only events carrying both sides produce one.
     */
    private buildChangeset(
        model: CmsModel,
        original: CmsEntry | undefined,
        entry: CmsEntry
    ): { changeset: ChangesetEntry[]; truncated: boolean } {
        if (!original) {
            return { changeset: [], truncated: false };
        }

        return diffValues(modelToFieldDescriptors(model), original.values, entry.values);
    }

    /** The entry identity without its revision suffix, so a timeline spans revisions. */
    private targetIdOf(entry: CmsEntry): string {
        if (entry.entryId) {
            return entry.entryId;
        }

        return parseIdentifier(entry.id).id;
    }
}

export const EntryActivityRecorder = Abstraction.createImplementation({
    implementation: EntryActivityRecorderImpl,
    dependencies: [ActivityWriter]
});
