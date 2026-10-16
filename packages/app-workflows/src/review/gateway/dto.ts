import type { ReviewActorType } from "~/review/domain/types.js";
import type { ReviewListMeta } from "~/review/domain/types.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";

export interface ReviewActorDto {
    type: ReviewActorType;
    id: string;
    displayName: string;
    identityType: string | null;
}

export interface ReviewStepAssignmentDto {
    source: string;
    ruleId: string | null;
    reason: string | null;
    by: ReviewActorDto | null;
}

export interface ReviewAssignmentEntryDto {
    id: string;
    kind: "outcome" | "skip";
    userId: string | null;
    userDisplayName: string | null;
    assignedOn: string;
    source: string;
    ruleId: string | null;
    by: ReviewActorDto | null;
    reason: string | null;
}

export interface ReviewStepRunDto {
    taskId: string | null;
    startedOn: string;
    finishedOn: string | null;
    outcome: string | null;
    reason: string | null;
}

export interface ReviewAiIssueDto {
    fieldPath: string | null;
    severity: string;
    message: string;
    suggestion: string | null;
}

export interface ReviewCandidateTeamDto {
    id: string;
    name: string;
}

export interface ReviewStepDto {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    state: StepStateValue;
    owner: ReviewActorDto | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    candidateTeams: ReviewCandidateTeamDto[];
    assignmentSource: string | null;
    assignment: ReviewStepAssignmentDto | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
    taskId: string | null;
    runs: ReviewStepRunDto[];
    issues: ReviewAiIssueDto[];
    // Only on a single review read (`REVIEW_ASSIGNMENT_FIELDS`); absent on lists.
    assignments?: ReviewAssignmentEntryDto[] | null;
}

export interface ReviewTargetFolderDto {
    id: string;
    type: string;
}

export interface ReviewTargetAuthorDto {
    id: string;
    displayName: string;
}

export interface ReviewTargetContextDto {
    folder: ReviewTargetFolderDto | null;
    modelId: string;
    title: string;
    author: ReviewTargetAuthorDto;
}

export interface ReviewWorkflowRefDto {
    name: string;
    models: string[];
}

export interface ReviewDto {
    id: string;
    workflowId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    isActive: boolean;
    state: ReviewStateValue;
    currentStepId: string | null;
    currentStepState: StepStateValue | null;
    currentStepType: string | null;
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[];
    targetContext: ReviewTargetContextDto;
    workflow: ReviewWorkflowRefDto;
    steps: ReviewStepDto[];
    createdBy: ReviewActorDto;
    cancelledBy: ReviewActorDto | null;
    createdOn: string;
    savedOn: string;
    lastChangedOn: string;
}

export interface ViewerFlagsDto {
    canStart: boolean;
    canTakeOver: boolean;
    canApprove: boolean;
    canReject: boolean;
    canCancel: boolean;
    canReassign: boolean;
    canRestart: boolean;
}

export interface ReviewWithFlagsDto {
    review: ReviewDto;
    flags: ViewerFlagsDto;
}

export interface WorkflowStepDto {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    // The step config (JSON); only `assignment.allowManualPick` of a review step is read.
    config: unknown;
}

export interface WorkflowDto {
    id: string;
    name: string;
    // The namespaces the workflow binds (`cms.<modelId>`, `wb.page`).
    models: string[];
    steps: WorkflowStepDto[];
}

export interface StepCandidateDto {
    id: string;
    displayName: string;
    excluded: boolean;
    excludedReason: string | null;
}

export interface ReviewErrorDto {
    code: string | null;
    message: string | null;
    data: unknown;
}

export interface ReviewEnvelope<T> {
    data: T | null;
    error: ReviewErrorDto | null;
}

export interface ReviewListEnvelope {
    data: ReviewWithFlagsDto[] | null;
    meta: ReviewListMeta | null;
    error: ReviewErrorDto | null;
}
