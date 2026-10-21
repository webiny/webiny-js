import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import type { AssignmentDecision, AssignmentSource } from "~/domain/assignment/types.js";

export type ReviewState = "inProgress" | "approved" | "rejected" | "cancelled";

export type StepState = "pending" | "awaiting" | "inReview" | "approved" | "rejected" | "failed";

export type ActorType = "user" | "ai" | "automation";

/** Who acted or holds a step (D3, D30). For AI and automation, `id` is the requester's id (D58). */
export interface Actor {
    type: ActorType;
    id: string;
    displayName: string;
    identityType?: string;
}

/** "Why this owner" (D127, R109). `ruleId`: the rule that decided, also for a team target. */
export interface ReviewStepAssignment {
    source: AssignmentSource;
    ruleId?: string;
    reason?: string;
    by?: Actor;
}

/** How an earlier attempt of a step ended (D82). */
export type StepRunOutcome = "approved" | "rejected" | "failed";

/**
 * One earlier attempt of a step (D82, R139): the history `Review.restart` appends the failed
 * attempt to. `taskId` is `null` when the reach failed before a task started.
 */
export interface ReviewStepRun {
    taskId: string | null;
    startedOn: string;
    finishedOn: string | null;
    outcome: StepRunOutcome | null;
    reason: string | null;
}

export type AiIssueSeverity = "error" | "warning" | "info";

/**
 * One finding of an AI decision (D39, R171). `fieldPath` is a dotted path into the target
 * (`null` when the finding is about the whole target); `suggestion` is an optional fix.
 */
export interface AiIssue {
    fieldPath: string | null;
    severity: AiIssueSeverity;
    message: string;
    suggestion: string | null;
}

export interface ReviewStep extends WorkflowStep {
    state: StepState;
    owner: Actor | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    assignmentSource: AssignmentSource | null;
    assignment: ReviewStepAssignment | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
    /** The current attempt's background task id, also the run id (D57, R139). */
    taskId: string | null;
    /** Earlier attempts, oldest first (D82, R139). */
    runs: ReviewStepRun[];
    /** The findings of an AI decision; empty for every other step and before a decision (R171). */
    issues: AiIssue[];
}

export interface ReviewWorkflowSnapshot {
    name: string;
    models: string[];
}

export interface TargetContextFolder {
    id: string;
    type: string;
}

export interface TargetContextAuthor {
    id: string;
    displayName: string;
}

/** Produced by the target adapter (`ReviewTargetLoader`, spec 9.3). */
export interface TargetContext {
    folder: TargetContextFolder | null;
    modelId: string;
    title: string;
    author: TargetContextAuthor;
}

export interface ReviewData {
    id: string;
    workflowId: string;
    /** Namespace id, e.g. "cms.article" (D41). */
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    /** Current review of the revision; false only after cancel (D23). */
    isActive: boolean;
    state: ReviewState;
    currentStepId: string | null;
    currentStepState: StepState | null;
    /**
     * Type of the current step, e.g. "review", "ai" or "automation" (D112): the failed steps list
     * filters on it. `null` when there is no current step (before the first save, after cancel).
     */
    currentStepType: string | null;
    /** Only for `user` owners (D74). */
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[];
    targetContext: TargetContext;
    workflow: ReviewWorkflowSnapshot;
    steps: ReviewStep[];
    /** The requester. */
    createdBy: Actor;
    /*
     * Who cancelled the review (R252): set once by `cancel`, never changed after (D75). Absent on
     * a review that is not cancelled and on a review cancelled before the field existed; the
     * mapper reads both as `null`.
     */
    cancelledBy?: Actor | null;
    createdOn: string;
    savedOn: string;
    /** Changes on every review event; list sort key (D119). */
    lastChangedOn: string;
}

export interface ReviewPick {
    stepId: string;
    userId: string;
}

/** Result of assignment resolution on step reached (spec 5.2, 6). */
export interface StepAssignmentResolution {
    owner: Actor | null;
    candidateTeamIds: string[];
    assignment: ReviewStepAssignment;
    /**
     * The assignment-log records of this decision, in order: skips first, then one outcome
     * (R117). Written by `ReviewSaver` after the review is saved.
     */
    records: AssignmentDecision[];
}

/** The value of `system.workflow` on the target revision (spec 4.5). */
export interface ReviewSystemWorkflow {
    workflowId: string;
    reviewState: ReviewState;
    stepId: string;
    stepName: string;
    stepState: StepState;
}

/**
 * The permission side of a reading user (spec 8): who acts and what the `workflows` permission
 * grants. Enough for the permission-only predicates (R41); no team lookup needed.
 */
export interface ReviewPermissionViewer {
    actor: Actor;
    permissions: WorkflowsPermissionSet;
}

/**
 * The reading user (spec 5.3). Built by the app wrapper from the identity (D132), e.g. through
 * `CurrentReviewViewer`; AI and automation callers never need one.
 */
export interface ReviewViewer extends ReviewPermissionViewer {
    teamIds: string[];
}

/**
 * Per-viewer flags for one review (spec 5.3, D5, D54). Domain rules and workflows permissions
 * only: the app wrapper ANDs its target read access into every flag (start, take over, approve,
 * reject, cancel, reassign, restart; spec 5.1, D133 point 7) before showing or allowing an action
 * (R33). Request and `canPick` need write access instead; they are not flags here.
 */
export interface ReviewViewerFlags {
    canStart: boolean;
    canTakeOver: boolean;
    canApprove: boolean;
    canReject: boolean;
    canCancel: boolean;
    canReassign: boolean;
    /** The current step failed, and the viewer is the requester or holds `reassign` (D34, R153). */
    canRestart: boolean;
}

/** What the app wrapper knows about the reading user's access to the review's target. */
export interface ReviewTargetAccess {
    canRead: boolean;
}

/** A review read by an app wrapper for one viewer (spec 5.3, R62). */
export interface ReviewWithViewerFlags {
    review: ReviewData;
    flags: ReviewViewerFlags;
}

/** The review lists of every app (spec 11, D47, D94, D112). */
export type ReviewListKind =
    | "assignedToMe"
    | "pool"
    | "teamInReview"
    | "myRequests"
    | "failedSteps";

/** Lists sort by the last review event (D119). */
export type ReviewListSort = "lastChangedOn_ASC" | "lastChangedOn_DESC";

/** List filters. The namespace filter is the app wrapper's `models` input (R91, R94). */
export interface ReviewListWhere {
    /** Every word of it appears in the title, case-insensitive. */
    titleContains?: string | null;
    /** Only `myRequests` (D94); other lists fail with `ReviewValidationError`. */
    reviewState?: ReviewState | null;
    /** Only `myRequests` (D94); other lists fail with `ReviewValidationError`. */
    stepState?: StepState | null;
}

/** No `totalCount`: rows the viewer cannot read are skipped, so no exact count exists (D76). */
export interface ReviewListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
}
