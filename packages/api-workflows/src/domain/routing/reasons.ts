/**
 * Fixed reasons on skip records and trace entries (R112). An exclusion's own text never goes
 * into a record (D89, D97); only the inspector's trace and skipped list show it (R129).
 */
export const ROUTING_SKIP_REASONS = {
    requester: "The requester cannot review.",
    notMember: "Not a member of the step's teams.",
    excluded: "Excluded from reviews.",
    cannotRead: "Cannot read this content."
} as const;

export type RoutingSkipReason = (typeof ROUTING_SKIP_REASONS)[keyof typeof ROUTING_SKIP_REASONS];

/**
 * The fixed reason for a rule whose team target is not one of the step's teams (spec 6): the rule
 * is skipped with a skip record without a user, and evaluation continues. Save-time validation and
 * the inspector refuse such a rule, so it appears only for a stored workflow whose teams changed or
 * that was written without validation.
 */
export const ROUTING_TEAM_TARGET_SKIP_REASON = "Not one of the step's teams.";

/** The pool reason when anything in resolution failed (R116). */
export const ROUTING_FAILED_REASON = "Routing failed; the step went to the pool.";

/** The pool reason when a strategy found nobody who can review (R111). */
export const ROUTING_NO_CANDIDATE_REASON = "No eligible candidate; the step went to the pool.";
