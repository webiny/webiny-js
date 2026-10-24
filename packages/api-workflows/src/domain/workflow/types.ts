export interface WorkflowStepNotification {
    /** Notification transport id, e.g. "e-mail" (D44). */
    id: string;
}

export interface WorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    /** Step type id; a registered `StepType` (R131), e.g. "review" or "automation". */
    type: string;
    notifications: WorkflowStepNotification[];
    /** Validated by the step type's schema; for "review" see `ReviewStepConfig`. */
    config: unknown;
}

export interface WorkflowValues {
    id: string;
    name: string;
    /** Namespace ids, e.g. `["cms.article"]`; exactly one in v1 (D15). */
    models: string[];
    steps: WorkflowStep[];
}

export interface WorkflowIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface Workflow extends WorkflowValues {
    createdOn: string;
    savedOn: string;
    createdBy: WorkflowIdentity;
    savedBy: WorkflowIdentity;
}

export type RoutingStrategy = "none" | "roundRobin" | "leastLoaded";

export type RoutingRuleTargetType = "user" | "team";

export interface RoutingRuleFolderCondition {
    id: string;
    type: string;
    includeDescendants: boolean;
}

export interface RoutingRuleConditions {
    requesterUserId?: string;
    requesterTeamId?: string;
    folder?: RoutingRuleFolderCondition;
    modelId?: string;
}

export interface RoutingRuleTarget {
    type: RoutingRuleTargetType;
    id: string;
}

export interface RoutingRule {
    id: string;
    conditions: RoutingRuleConditions;
    target: RoutingRuleTarget;
}

export interface ReviewStepAssignmentConfig {
    strategy: RoutingStrategy;
    allowManualPick: boolean;
    /** Ordered; first match wins (spec 6). */
    rules: RoutingRule[];
}

export interface ReviewStepConfig {
    /** Team ids; at least one. */
    teams: string[];
    assignment: ReviewStepAssignmentConfig;
}

/** A step without teams (spec 4.1). */
export interface ReviewStepConfigNoTeamsProblem {
    type: "noTeams";
}

/**
 * Two rules of a step share an id. Rules are named by id in errors, trace entries, assignment
 * records and the narrowed team (R288), so ids must be unique within a step.
 */
export interface ReviewStepConfigDuplicateRuleIdProblem {
    type: "duplicateRuleId";
    ruleId: string;
}

/** A rule whose team target is not one of the step's teams (spec 6). */
export interface ReviewStepConfigTeamTargetProblem {
    type: "teamTargetOutsideTeams";
    ruleId: string;
}

/** The first problem of a parsed review step config; callers word their own messages. */
export type ReviewStepConfigProblem =
    | ReviewStepConfigNoTeamsProblem
    | ReviewStepConfigDuplicateRuleIdProblem
    | ReviewStepConfigTeamTargetProblem;

/**
 * A review that blocks deleting its workflow (D115): the content reference, its title and where
 * the review stands. The engine lists all of them; the app wrapper keeps the first 5 the caller
 * can read (D133, R57).
 */
export interface WorkflowBlockingReview {
    reviewId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    /** 1-based position of the current step ("Step n of N"). */
    stepPosition: number;
    stepCount: number;
    stepName: string;
}
