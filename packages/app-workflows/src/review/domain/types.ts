import type { ReviewStateValue } from "./ReviewState.js";
import type { StepStateValue } from "./StepState.js";
import type { StepRunTaskStatus } from "./StepRunTaskStatus.js";

export type ReviewActorType = "user" | "ai" | "automation";

export type ReviewForDeleteAction = "trash" | "delete";

export interface ReviewActor {
    type: ReviewActorType;
    id: string;
    displayName: string;
    identityType: string | null;
}

export interface ReviewStepAssignment {
    source: string;
    ruleId: string | null;
    reason: string | null;
    by: ReviewActor | null;
}

export interface ReviewAssignmentEntry {
    id: string;
    kind: "outcome" | "skip";
    userId: string | null;
    userDisplayName: string | null;
    assignedOn: string;
    source: string;
    ruleId: string | null;
    by: ReviewActor | null;
    reason: string | null;
}

export interface ReviewStepRun {
    taskId: string | null;
    startedOn: string;
    finishedOn: string | null;
    outcome: string | null;
    reason: string | null;
}

export interface ReviewAiIssue {
    fieldPath: string | null;
    severity: string;
    message: string;
    suggestion: string | null;
}

export interface ReviewCandidateTeam {
    id: string;
    name: string;
}

export interface ReviewStep {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    state: StepStateValue;
    owner: ReviewActor | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    candidateTeams: ReviewCandidateTeam[];
    assignmentSource: string | null;
    assignment: ReviewStepAssignment | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
    taskId: string | null;
    runs: ReviewStepRun[];
    issues: ReviewAiIssue[];
    assignments: ReviewAssignmentEntry[] | null;
}

export interface ReviewTargetFolder {
    id: string;
    type: string;
}

export interface ReviewTargetAuthor {
    id: string;
    displayName: string;
}

export interface ReviewTargetContext {
    folder: ReviewTargetFolder | null;
    modelId: string;
    title: string;
    author: ReviewTargetAuthor;
}

export interface Review {
    id: string;
    workflowId: string;
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    isActive: boolean;
    state: ReviewStateValue;
    currentStepId: string | null;
    currentStepType: string | null;
    currentOwnerId: string | null;
    currentStepState: StepStateValue | null;
    currentCandidateTeamIds: string[];
    targetContext: ReviewTargetContext;
    workflowName: string;
    steps: ReviewStep[];
    createdBy: ReviewActor;
    cancelledBy: ReviewActor | null;
    createdOn: string;
    savedOn: string;
    lastChangedOn: string;
}

export interface ReviewViewerFlags {
    canStart: boolean;
    canTakeOver: boolean;
    canApprove: boolean;
    canReject: boolean;
    canCancel: boolean;
    canReassign: boolean;
    canRestart: boolean;
}

export interface ReviewWithFlags {
    review: Review;
    flags: ReviewViewerFlags;
}

export interface ReviewWorkflowStep {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    allowManualPick: boolean;
    assignedAutomatically: boolean;
}

export interface ReviewWorkflow {
    id: string;
    name: string;
    namespaces: string[];
    steps: ReviewWorkflowStep[];
}

export interface ReviewTarget {
    namespace: string;
    targetRevisionId: string;
}

export interface StepCandidate {
    id: string;
    displayName: string;
    /** The names of the member's teams among the step's teams, in the step's order. */
    teamNames: string[];
    excluded: boolean;
    excludedReason: string | null;
}

export interface BlockingReview {
    reviewId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    stepPosition: number;
    stepCount: number;
    stepName: string;
}

/*
 * What workflows tells about one step's background task (R257): only these fields, never the task
 * input, output or logs (R146).
 */
export interface ReviewStepRunInfo {
    taskId: string;
    status: StepRunTaskStatus;
    startedOn: string | null;
    finishedOn: string | null;
    // The automation's own run count, computed by the server.
    iterations: number;
    outcome: string | null;
    reason: string | null;
}

export interface ActiveReviewOnTrashData {
    model: string;
    action: ReviewForDeleteAction;
    reviews: BlockingReview[];
}

/*
 * One row of a review list, app-neutral (R206). Private state of `ReviewListPresenter`, never a
 * view model (R234).
 */
export interface ReviewListRow {
    namespace: string;
    reviewId: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    reviewState: ReviewStateValue;
    stepId: string | null;
    stepTitle: string | null;
    // The current step's colour; null without a current step, so the row renders no dot.
    stepColor: string | null;
    stepState: StepStateValue | null;
    owner: ReviewActor | null;
    requester: ReviewActor;
    lastChangedOn: string;
    contentTypeId: string;
    flags: ReviewViewerFlags;
}

export interface ReviewListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
}

// `meta.system.workflow` of a target revision in the shape the lists select (R213).
export interface SystemWorkflowValue {
    workflowId: string;
    reviewState: ReviewStateValue;
    stepId: string | null;
    stepName: string | null;
    stepState: StepStateValue | null;
}

/*
 * The viewer's `workflows` permission as the client reads it (R259): `fullAccess` is `workflows.*`
 * or `*`; `editor` and `reassign` include full access.
 */
export interface WorkflowsPermissionSet {
    fullAccess: boolean;
    editor: boolean;
    reassign: boolean;
}
