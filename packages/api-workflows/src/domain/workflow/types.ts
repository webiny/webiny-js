export interface WorkflowStepNotification {
    /** Notification transport id, e.g. "e-mail" (D44). */
    id: string;
}

export interface WorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    /** Step type id. Phase 1a accepts only "review" (R7). */
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
