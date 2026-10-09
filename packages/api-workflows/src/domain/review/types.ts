import type { WorkflowStep } from "~/domain/workflow/types.js";

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

/** "Why this owner" (D127). Sources: rule id, "strategy", "picked", "pool", "poolStart", "takeOver", "reassign". */
export interface ReviewStepAssignment {
    source: string;
    ruleId?: string;
    reason?: string;
    by?: Actor;
}

export interface ReviewStep extends WorkflowStep {
    state: StepState;
    owner: Actor | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    assignmentSource: string | null;
    assignment: ReviewStepAssignment | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
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
    /** Only for `user` owners (D74). */
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[];
    targetContext: TargetContext;
    workflow: ReviewWorkflowSnapshot;
    steps: ReviewStep[];
    /** The requester. */
    createdBy: Actor;
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
}

/** The value of `system.workflow` on the target revision (spec 4.5). */
export interface ReviewSystemWorkflow {
    workflowId: string;
    reviewState: ReviewState;
    stepId: string;
    stepName: string;
    stepState: StepState;
}
