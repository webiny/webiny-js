import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { diffValues } from "~/api/core/diff/diffValues.js";
import type { ActivityRecord, ChangesetEntry } from "~/api/core/types.js";
import { modelToFieldDescriptors } from "~/api/cms/model/toFieldDescriptors.js";
import { SummaryDispatcher } from "~/api/cms/summary/SummaryDispatcher.js";
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
    constructor(
        private writer: ActivityWriter.Interface,
        private summaries: SummaryDispatcher.Interface
    ) {}

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

            // Planned before the write so the run's values land in the same append as the record,
            // and so a save that routes deterministic — the overwhelming majority — never pays for
            // the previous-record lookup the debounce needs.
            //
            // Contained separately from the rest of this method, and that separation is the point:
            // the outer `try` would swallow a planning failure along with the write, costing the
            // record rather than the sentence. A save that lost its activity row because a model
            // could not be reached would be a far worse outcome than a missing summary.
            const plan = await this.planSummary({
                model,
                targetId: this.targetIdOf(entry),
                revision: entry.id,
                changeset,
                before: original?.values,
                after: entry.values
            });

            const record = await this.writer.write({
                targetId: this.targetIdOf(entry),
                revision: entry.id,
                action,
                correlationId,
                changeset,
                truncated,
                ...(plan.state ? { summaryState: plan.state } : {}),
                ...(plan.summary ? { summary: plan.summary } : {}),
                ...(plan.summaryKind ? { summaryKind: plan.summaryKind } : {}),
                ...(plan.summaryRunId ? { summaryRunId: plan.summaryRunId } : {})
            });

            // No record means the append failed and was contained. There is nothing to hand a job,
            // and nothing to extend.
            if (record) {
                await this.followSummary(plan, record);
            }
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

    /** Never throws: a planning failure degrades to no summary, never to a lost record. */
    private async planSummary(
        params: SummaryDispatcher.PlanParams
    ): Promise<SummaryDispatcher.Plan> {
        try {
            return await this.summaries.plan(params);
        } catch (error) {
            this.reportSummaryFailure("plan", params.targetId, error);
            return { state: undefined };
        }
    }

    /** Never throws either. Dispatch rethrows into its caller, and its caller is the entry write. */
    private async followSummary(
        plan: SummaryDispatcher.Plan,
        record: ActivityRecord
    ): Promise<void> {
        try {
            await this.summaries.follow(plan, record);
        } catch (error) {
            this.reportSummaryFailure("dispatch", record.targetId, error);
        }
    }

    private reportSummaryFailure(stage: string, targetId: string, error: unknown): void {
        try {
            console.error(
                `[activity-log] Summary ${stage} failed for target "${targetId}". ` +
                    `The record and the write were not affected.`,
                error
            );
        } catch {
            // Logging must not break the write either.
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
    dependencies: [ActivityWriter, SummaryDispatcher]
});
