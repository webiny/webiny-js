import type { AssignmentDecision, AssignmentSource } from "~/domain/assignment/types.js";
import type { TargetContextFolder } from "~/domain/review/types.js";
import type { WorkflowExclusion } from "~/domain/settings/types.js";
import type { ReviewStepConfig, RoutingStrategy } from "~/domain/workflow/types.js";
import type { RoutingSkipReason } from "./reasons.js";

/** Read access to a target revision: step reach, request candidates, reassign. */
export interface RoutingTargetReadScope {
    type: "target";
    targetId: string;
    targetRevisionId: string;
}

/** Read access to a folder's content, without a revision: the inspector (R121). */
export interface RoutingFolderReadScope {
    type: "folder";
    /** `null`: the root folder (model read only). */
    folderId: string | null;
}

export type RoutingReadScope = RoutingTargetReadScope | RoutingFolderReadScope;

export interface RoutingUser {
    id: string;
    displayName: string;
}

/** What routing reads of an admin user (`AdminUser` fits). */
export interface RoutingDirectoryUser {
    id: string;
    displayName: string;
    teams?: string[];
}

/** The sources a step-reach decision can have (R109). */
export type RoutingSource = Extract<
    AssignmentSource,
    "picked" | "rule" | "roundRobin" | "leastLoaded" | "pool"
>;

export type RoutingStrategyName = Exclude<RoutingStrategy, "none">;

export type RoutingTraceOutcome = "matched" | "notMatched" | "skipped";

/** One evaluated rule, for the inspector (R121). No load numbers. */
export interface RoutingTraceEntry {
    ruleId: string;
    outcome: RoutingTraceOutcome;
    /**
     * The skip reason for `skipped`; `null` otherwise. An excluded user target shows the
     * exclusion's own reason, or "Excluded from reviews." when it has none (R129, D118).
     */
    reason: string | null;
}

/**
 * A person routing skipped, for the inspector (R129, D118): a pick, a rule user target or a
 * strategy candidate refused read access. Same reason as the trace; never written to a record.
 */
export interface RoutingSkippedUser {
    userId: string;
    /** `null` for a user who is not a member of the step's teams (not looked up). */
    displayName: string | null;
    reason: string;
}

/** What rule conditions are matched against without a lookup (R113). */
export interface RoutingRuleLocalFacts {
    requesterId: string;
    /** The model id of the review's namespace (`getNamespaceModelId`). */
    modelId: string;
    /** The target's folder; `null` for the root. */
    folder: TargetContextFolder | null;
}

/** What rule conditions are matched against (R113). */
export interface RoutingRuleFacts extends RoutingRuleLocalFacts {
    /** Empty when the lookup failed or the requester is an API key. */
    requesterTeamIds: string[];
    /** The folder and its ancestors, nearest first; empty when not read. */
    folderChainIds: string[];
}

export interface RoutingEvaluateParams {
    config: ReviewStepConfig;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    /** `null` for a workflow not stored yet: round robin has no history. */
    workflowId: string | null;
    /**
     * The review being routed; least loaded does not count it as load. `null` without a review
     * (the inspector).
     */
    reviewId: string | null;
    stepId: string;
    requesterId: string;
    /** The requester's pick for this step; used only when the step allows picks. */
    pickedUserId: string | null;
    folder: TargetContextFolder | null;
    read: RoutingReadScope;
    /** The reach time (R118): exclusion expiry is evaluated at this instant. */
    now: Date;
}

/** The decision for one step (spec 6). */
export interface RoutingEvaluation {
    owner: RoutingUser | null;
    source: RoutingSource;
    /** The rule that decided, also for a team target that narrowed the candidates (R109). */
    ruleId: string | null;
    /** The step's configured strategy. */
    strategy: RoutingStrategy;
    candidateTeamIds: string[];
    /** The pool reason, e.g. no eligible candidate; `null` for an owner. */
    reason: string | null;
    /** Skips in decision order, then one outcome (R117). Fixed reasons only (D89, D97). */
    records: AssignmentDecision[];
    trace: RoutingTraceEntry[];
    /** The skipped people in decision order, with the trace's reasons (R129). */
    skipped: RoutingSkippedUser[];
}

export interface RoutingMembersParams {
    teamIds: string[];
    requesterId: string;
    model: string;
    read: RoutingReadScope;
    now: Date;
}

/** A member of the step's teams, for candidate lists (R120). */
export interface RoutingMember {
    id: string;
    displayName: string;
    teamIds: string[];
    /** The active exclusion, with its own reason; `null` when not excluded. */
    exclusion: WorkflowExclusion | null;
    canRead: boolean;
}

export interface RoutingUserCheckParams {
    userId: string;
    teamIds: string[];
    requesterId: string;
    model: string;
    read: RoutingReadScope;
    now: Date;
}

/** Validity of one person target (R112). Valid when `skipReason` is `null`. */
export interface RoutingUserCheck {
    /** Set whenever the user is a member of the teams. */
    user: RoutingUser | null;
    skipReason: RoutingSkipReason | null;
}
