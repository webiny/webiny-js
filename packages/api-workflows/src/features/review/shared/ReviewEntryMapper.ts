import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowStepNotification } from "~/domain/workflow/types.js";
import type { AssignmentSource } from "~/domain/assignment/types.js";
import type {
    AiIssue,
    AiIssueSeverity,
    ReviewData,
    ReviewState,
    ReviewStep,
    ReviewStepAssignment,
    StepRunOutcome,
    StepState,
    TargetContextAuthor,
    TargetContextFolder
} from "~/domain/review/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";
import { ActorEntryMapper, type ActorEntryValues } from "~/features/shared/ActorEntryMapper.js";

export interface ReviewEntryStepAssignment {
    source: string;
    ruleId: string | null;
    reason: string | null;
    by: ActorEntryValues | null;
}

export interface ReviewEntryStepRun {
    taskId: string | null;
    startedOn: string | Date | null;
    finishedOn: string | Date | null;
    outcome: string | null;
    reason: string | null;
}

export interface ReviewEntryStepIssue {
    fieldPath: string | null;
    severity: string;
    message: string;
    suggestion: string | null;
}

export interface ReviewEntryStep {
    id: string;
    title: string;
    color: string | null;
    description: string | null;
    type: string;
    notifications: WorkflowStepNotification[] | null;
    config: unknown;
    state: string;
    owner: ActorEntryValues | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[] | null;
    assignmentSource: string | null;
    assignment: ReviewEntryStepAssignment | null;
    reachedOn: string | Date | null;
    startedOn: string | Date | null;
    finishedOn: string | Date | null;
    taskId: string | null;
    runs: ReviewEntryStepRun[] | null;
    issues: ReviewEntryStepIssue[] | null;
}

export interface ReviewEntryTargetContext {
    folder: TargetContextFolder | null;
    modelId: string;
    title: string;
    author: TargetContextAuthor | null;
}

export interface ReviewEntryWorkflow {
    name: string;
    models: string[] | null;
}

export interface ReviewEntryValues {
    workflowId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    isActive: boolean;
    state: string;
    currentStepId: string | null;
    currentStepState: string | null;
    currentStepType: string | null;
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[] | null;
    targetContext: ReviewEntryTargetContext | null;
    workflow: ReviewEntryWorkflow | null;
    steps: ReviewEntryStep[] | null;
    requester: ActorEntryValues | null;
    // Absent on entries stored before the field existed (R252).
    cancelledBy?: ActorEntryValues | null;
    lastChangedOn: string | Date | null;
}

/** Maps reviews to and from `wbyWorkflowReview` entries; nulls in storage become absent optionals. */
export class ReviewEntryMapper {
    public static toValues(review: ReviewData): ReviewEntryValues {
        return {
            workflowId: review.workflowId,
            model: review.model,
            targetId: review.targetId,
            targetRevisionId: review.targetRevisionId,
            title: review.title,
            isActive: review.isActive,
            state: review.state,
            currentStepId: review.currentStepId,
            currentStepState: review.currentStepState,
            currentStepType: review.currentStepType,
            currentOwnerId: review.currentOwnerId,
            currentCandidateTeamIds: [...review.currentCandidateTeamIds],
            targetContext: {
                folder: review.targetContext.folder ? { ...review.targetContext.folder } : null,
                modelId: review.targetContext.modelId,
                title: review.targetContext.title,
                author: { ...review.targetContext.author }
            },
            workflow: {
                name: review.workflow.name,
                models: [...review.workflow.models]
            },
            steps: review.steps.map(step => ReviewEntryMapper.stepToEntry(step)),
            requester: ActorEntryMapper.toEntry(review.createdBy),
            cancelledBy: review.cancelledBy ? ActorEntryMapper.toEntry(review.cancelledBy) : null,
            lastChangedOn: review.lastChangedOn
        };
    }

    public static fromEntry(entry: CmsEntry<ReviewEntryValues>): ReviewData {
        const { id } = parseIdentifier(entry.id);
        const values = entry.values;
        const folder = values.targetContext?.folder;
        return {
            id,
            workflowId: values.workflowId,
            model: values.model,
            targetId: values.targetId,
            targetRevisionId: values.targetRevisionId,
            title: values.title,
            isActive: values.isActive === true,
            state: values.state as ReviewState,
            currentStepId: values.currentStepId ?? null,
            currentStepState: (values.currentStepState ?? null) as StepState | null,
            // Reviews stored before the field existed read as `null` (R93).
            currentStepType: values.currentStepType ?? null,
            currentOwnerId: values.currentOwnerId ?? null,
            currentCandidateTeamIds: values.currentCandidateTeamIds ?? [],
            targetContext: {
                folder: folder?.id ? { id: folder.id, type: folder.type } : null,
                modelId: values.targetContext?.modelId ?? "",
                title: values.targetContext?.title ?? "",
                author: {
                    id: values.targetContext?.author?.id ?? "",
                    displayName: values.targetContext?.author?.displayName ?? ""
                }
            },
            workflow: {
                name: values.workflow?.name ?? "",
                models: values.workflow?.models ?? []
            },
            steps: (values.steps ?? []).map(step => ReviewEntryMapper.stepFromEntry(step)),
            createdBy: ActorEntryMapper.fromEntry(values.requester) ?? {
                type: "user",
                id: "",
                displayName: ""
            },
            // Reviews stored before the field existed, and reviews that are not cancelled, read `null`.
            cancelledBy: ActorEntryMapper.fromEntry(values.cancelledBy),
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            lastChangedOn: toIsoString(values.lastChangedOn) ?? entry.savedOn
        };
    }

    private static stepToEntry(step: ReviewStep): ReviewEntryStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color,
            description: step.description ?? null,
            type: step.type,
            notifications: step.notifications.map(notification => ({ id: notification.id })),
            config: step.config,
            state: step.state,
            owner: step.owner ? ActorEntryMapper.toEntry(step.owner) : null,
            comment: step.comment,
            pickedUserId: step.pickedUserId,
            candidateTeamIds: [...step.candidateTeamIds],
            assignmentSource: step.assignmentSource,
            assignment: step.assignment
                ? {
                      source: step.assignment.source,
                      ruleId: step.assignment.ruleId ?? null,
                      reason: step.assignment.reason || null,
                      by: step.assignment.by ? ActorEntryMapper.toEntry(step.assignment.by) : null
                  }
                : null,
            reachedOn: step.reachedOn,
            startedOn: step.startedOn,
            finishedOn: step.finishedOn,
            taskId: step.taskId,
            runs: step.runs.map(run => ({
                taskId: run.taskId,
                startedOn: run.startedOn,
                finishedOn: run.finishedOn,
                outcome: run.outcome,
                reason: run.reason
            })),
            issues: step.issues.map((issue: AiIssue) => ({
                fieldPath: issue.fieldPath,
                severity: issue.severity,
                message: issue.message,
                suggestion: issue.suggestion
            }))
        };
    }

    private static stepFromEntry(step: ReviewEntryStep): ReviewStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color ?? "",
            ...(step.description ? { description: step.description } : {}),
            type: step.type,
            notifications: (step.notifications ?? []).map(notification => ({
                id: notification.id
            })),
            config: step.config ?? null,
            state: step.state as StepState,
            owner: ActorEntryMapper.fromEntry(step.owner),
            comment: step.comment || null,
            pickedUserId: step.pickedUserId ?? null,
            candidateTeamIds: step.candidateTeamIds ?? [],
            // Only the engine writes this model, always with an `AssignmentSource` (R109).
            assignmentSource: (step.assignmentSource as AssignmentSource | null) ?? null,
            assignment: ReviewEntryMapper.assignmentFromEntry(step.assignment),
            reachedOn: toIsoString(step.reachedOn),
            startedOn: toIsoString(step.startedOn),
            finishedOn: toIsoString(step.finishedOn),
            // Reviews stored before the fields existed read as no task and no runs (R139).
            taskId: step.taskId || null,
            runs: (step.runs ?? []).map(run => ({
                taskId: run.taskId || null,
                startedOn: toIsoString(run.startedOn) ?? "",
                finishedOn: toIsoString(run.finishedOn),
                // Only the engine writes this model, always with a `StepRunOutcome`.
                outcome: (run.outcome as StepRunOutcome | null) || null,
                reason: run.reason || null
            })),
            // Reviews stored before the field existed read as no issues (R171, like R139).
            issues: (step.issues ?? []).map((issue): AiIssue => ({
                fieldPath: issue.fieldPath || null,
                // Only the engine writes this model, always with an `AiIssueSeverity`.
                severity: issue.severity as AiIssueSeverity,
                message: issue.message ?? "",
                suggestion: issue.suggestion || null
            }))
        };
    }

    private static assignmentFromEntry(
        value: ReviewEntryStepAssignment | null | undefined
    ): ReviewStepAssignment | null {
        if (!value?.source) {
            return null;
        }
        const by = ActorEntryMapper.fromEntry(value.by);
        return {
            source: value.source as AssignmentSource,
            ...(value.ruleId ? { ruleId: value.ruleId } : {}),
            ...(value.reason ? { reason: value.reason } : {}),
            ...(by ? { by } : {})
        };
    }
}
