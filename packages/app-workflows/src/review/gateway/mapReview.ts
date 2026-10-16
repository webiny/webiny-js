import type { ReviewActorDto } from "./dto.js";
import type { ReviewAssignmentEntryDto } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewStepAssignmentDto } from "./dto.js";
import type { ReviewStepDto } from "./dto.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewActor } from "~/review/domain/types.js";
import type { ReviewAssignmentEntry } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewStepAssignment } from "~/review/domain/types.js";

const mapActor = (dto: ReviewActorDto): ReviewActor => {
    return {
        type: dto.type,
        id: dto.id,
        displayName: dto.displayName,
        identityType: dto.identityType ?? null
    };
};

const mapOptionalActor = (dto: ReviewActorDto | null | undefined): ReviewActor | null => {
    return dto ? mapActor(dto) : null;
};

const mapAssignment = (
    dto: ReviewStepAssignmentDto | null | undefined
): ReviewStepAssignment | null => {
    if (!dto) {
        return null;
    }
    return {
        source: dto.source,
        ruleId: dto.ruleId ?? null,
        reason: dto.reason ?? null,
        by: mapOptionalActor(dto.by)
    };
};

const mapAssignmentEntry = (dto: ReviewAssignmentEntryDto): ReviewAssignmentEntry => {
    return {
        id: dto.id,
        kind: dto.kind,
        userId: dto.userId ?? null,
        userDisplayName: dto.userDisplayName ?? null,
        assignedOn: dto.assignedOn,
        source: dto.source,
        ruleId: dto.ruleId ?? null,
        by: mapOptionalActor(dto.by),
        reason: dto.reason ?? null
    };
};

const mapStep = (dto: ReviewStepDto): ReviewStep => {
    return {
        id: dto.id,
        title: dto.title,
        color: dto.color,
        description: dto.description ?? null,
        type: dto.type,
        state: dto.state,
        owner: mapOptionalActor(dto.owner),
        comment: dto.comment ?? null,
        pickedUserId: dto.pickedUserId ?? null,
        candidateTeamIds: dto.candidateTeamIds ?? [],
        candidateTeams: (dto.candidateTeams ?? []).map(team => ({ id: team.id, name: team.name })),
        assignmentSource: dto.assignmentSource ?? null,
        assignment: mapAssignment(dto.assignment),
        reachedOn: dto.reachedOn ?? null,
        startedOn: dto.startedOn ?? null,
        finishedOn: dto.finishedOn ?? null,
        taskId: dto.taskId ?? null,
        runs: (dto.runs ?? []).map(run => ({
            taskId: run.taskId ?? null,
            startedOn: run.startedOn,
            finishedOn: run.finishedOn ?? null,
            outcome: run.outcome ?? null,
            reason: run.reason ?? null
        })),
        issues: (dto.issues ?? []).map(issue => ({
            fieldPath: issue.fieldPath ?? null,
            severity: issue.severity,
            message: issue.message,
            suggestion: issue.suggestion ?? null
        })),
        assignments: dto.assignments ? dto.assignments.map(mapAssignmentEntry) : null
    };
};

/*
 * Maps a `WorkflowsReview` to the domain `Review`: `model` becomes `namespace`,
 * `workflow.name` becomes `workflowName`. Pure.
 */
export const mapReview = (dto: ReviewDto): Review => {
    const folder = dto.targetContext.folder;
    return {
        id: dto.id,
        workflowId: dto.workflowId,
        namespace: dto.model,
        targetId: dto.targetId,
        targetRevisionId: dto.targetRevisionId,
        title: dto.title,
        isActive: dto.isActive,
        state: dto.state,
        currentStepId: dto.currentStepId ?? null,
        currentStepType: dto.currentStepType ?? null,
        currentOwnerId: dto.currentOwnerId ?? null,
        currentStepState: dto.currentStepState ?? null,
        currentCandidateTeamIds: dto.currentCandidateTeamIds ?? [],
        targetContext: {
            folder: folder ? { id: folder.id, type: folder.type } : null,
            modelId: dto.targetContext.modelId,
            title: dto.targetContext.title,
            author: {
                id: dto.targetContext.author.id,
                displayName: dto.targetContext.author.displayName
            }
        },
        workflowName: dto.workflow.name,
        steps: dto.steps.map(mapStep),
        createdBy: mapActor(dto.createdBy),
        cancelledBy: mapOptionalActor(dto.cancelledBy),
        createdOn: dto.createdOn,
        savedOn: dto.savedOn,
        lastChangedOn: dto.lastChangedOn
    };
};
