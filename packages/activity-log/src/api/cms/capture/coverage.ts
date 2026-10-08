/**
 * What capture covers, declared rather than inferred.
 *
 * The failure this guards against is the one the design is most exposed to: a new entry write path
 * is added upstream, publishes its own event, and the activity log silently stops describing what
 * happens to entries. Nothing breaks, no test fails, and the gap is invisible until someone
 * notices a missing timeline row. So coverage is stated here and asserted against the CMS source.
 *
 * `CAPTURED_EVENTS` must be exhaustive over after-events. `OPT_OUT_RULES` is deliberately
 * pattern-based for the two families that will never be captured, so a new before-event or error
 * event does not fail the guard — but a new *after*-event does, loudly, which is the only case
 * where a human decision is actually needed.
 */

export const CAPTURED_EVENTS: Record<string, string> = {
    "Cms/Entry/AfterCreate": "RecordEntryCreated",
    "Cms/Entry/AfterUpdate": "RecordEntryUpdated",
    "Cms/Entry/RevisionAfterCreate": "RecordEntryRevisionCreated",
    "Cms/Entry/RevisionAfterDelete": "RecordEntryRevisionDeleted",
    "Cms/Entry/AfterPublish": "RecordEntryPublished",
    "Cms/Entry/AfterUnpublish": "RecordEntryUnpublished",
    "Cms/Entry/AfterRepublish": "RecordEntryRepublished",
    "Cms/Entry/AfterMove": "RecordEntryMoved",
    // Carries both trashing and permanent deletion, told apart by `permanent`.
    "Cms/Entry/AfterDelete": "RecordEntryDeleted",
    "Cms/Entry/AfterRestoreFromBin": "RecordEntryRestored",
    "Cms/Entry/AfterDeleteMultiple": "RecordEntriesDeletedInBulk",
    "Cms/Entry/AfterUpdateRevisionDescription": "RecordEntryRevisionDescribed"
};

export interface OptOutRule {
    matches: (eventType: string) => boolean;
    label: string;
    reason: string;
}

export const OPT_OUT_RULES: OptOutRule[] = [
    {
        matches: eventType => /\/(Before[A-Za-z]+|RevisionBefore[A-Za-z]+)$/.test(eventType),
        label: "before-events",
        reason:
            "A record describes what happened. Capturing before an operation would write records " +
            "for writes that then failed, and the after-event carries the same payload plus the " +
            "result."
    },
    {
        matches: eventType => /Error$/.test(eventType),
        label: "error-events",
        reason:
            "A failed write changed nothing, so it is not activity. Failures belong in logs and " +
            "monitoring, and recording them here would put rows on a timeline for changes that " +
            "never landed."
    }
];

/**
 * Write paths that publish no event at all, so capture cannot see them however complete the
 * handler set is. Documented as gaps rather than discovered as bugs.
 */
export const KNOWN_CAPTURE_GAPS: Record<string, string> = {
    ForceDeleteDecorator:
        "When force=true and the entry is already gone, it writes through " +
        "DeleteEntryStorageOperation directly and publishes nothing. A cleanup path for orphaned " +
        "records, so there is no editorial activity to describe — but it means storage can be " +
        "written without an event, and a deliberate gap is worth naming.",
    "api-scheduler/ScheduleAction":
        "Scheduling an entry and cancelling a schedule reach no entry event. The schedule is " +
        "persisted as an entry in the scheduler's own private model, which capture filters out, " +
        "and it would attach to that entry rather than the target. A scheduled publish " +
        "*executing* is captured normally, through PublishEntryUseCase.",
    "api-headless-cms/UpdateSingletonEntry":
        "Delegates to UpdateEntryUseCase, so it is captured by that path rather than being a gap. " +
        "Listed because it looks like a separate write path and is not."
};

/**
 * Publishing workflow events, same contract as the entry events above.
 *
 * The notable entry is the opt-out for `workflowState.afterUpdate`, which is where the brief's
 * design would have subscribed. It is excluded for two independent reasons, both verified against
 * the source rather than assumed:
 *
 *   - **It is incomplete.** `afterUpdate` is published only by `UpdateWorkflowStateUseCase`, and
 *     approve, reject, start and take-over all inject `UpdateWorkflowStateRepository` directly,
 *     bypassing the use case. Diffing it would therefore miss every step transition — that is,
 *     essentially the whole review.
 *   - **It would double-count.** `CancelWorkflowState` is the one action that goes *through* the
 *     use case, so it publishes both `afterUpdate` and `cancel`.
 *
 * The action events are the complete set: the GraphQL surface exposes exactly create, startStep,
 * approveStep, rejectStep, cancel and takeOverStep, and there is no `updateWorkflowState`
 * mutation, so no step state can change without one of them firing.
 */
export const CAPTURED_WORKFLOW_EVENTS: Record<string, string> = {
    "workflowState.afterCreate": "RecordReviewSubmitted",
    "workflowState.startStep": "RecordReviewStepStarted",
    "workflowState.approveStep": "RecordReviewStepApproved",
    "workflowState.reject": "RecordReviewStepRejected",
    "workflowState.takeOverStep": "RecordReviewStepTakenOver",
    "workflowState.cancel": "RecordReviewCancelled",
    "workflowState.afterDelete": "RecordReviewDeleted"
};

export const WORKFLOW_OPT_OUT_RULES: OptOutRule[] = [
    {
        matches: eventType => eventType === "workflowState.afterUpdate",
        label: "workflowState.afterUpdate",
        reason:
            "Incomplete and redundant. Published only by UpdateWorkflowStateUseCase, which the " +
            "four step actions bypass by writing through the repository directly, so it misses " +
            "every step transition. Cancel goes through the use case and so publishes both this " +
            "and its own event, meaning subscribing to both would double-count cancellations."
    },
    {
        matches: eventType => eventType.startsWith("workflow."),
        label: "workflow definition events",
        reason:
            "These describe a workflow being defined or reconfigured, not anything happening to " +
            "a content entry. An entry timeline is the wrong place for them; they belong to " +
            "model-level change tracking, which is explicitly out of scope."
    },
    {
        matches: eventType => /\.before[A-Z]/.test(eventType),
        label: "workflow before-events",
        reason:
            "A record describes what happened. Capturing before an operation would write records " +
            "for transitions that then failed."
    }
];
