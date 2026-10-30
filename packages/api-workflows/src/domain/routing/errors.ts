import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";
import { PersistenceError } from "~/domain/PersistenceError.js";

/**
 * What step-reach evaluation had decided when a lookup failed (R116 refined): the candidate
 * teams (narrowed when a team-target rule matched, else the step's teams), that rule, and the
 * skip records gathered so far, in decision order. The resolver's pool keeps them.
 */
export interface RoutingDecidedSoFar {
    candidateTeamIds: string[];
    ruleId: string | null;
    skips: AssignmentDecision[];
}

/**
 * A lookup routing needs failed: users, settings, the folder chain or a strategy's history
 * (R116). The resolver turns it into the pool; the inspector and candidate lists report it.
 * `decided` is set by step-reach evaluation and is not part of `data`: skip records never travel
 * on an error payload.
 */
export class RoutingDependencyError extends PersistenceError {
    override readonly code = "Workflows/Routing/Dependency" as const;
    public readonly decided: RoutingDecidedSoFar | null;

    /** Pass another `RoutingDependencyError` to keep its cause and add what was decided. */
    constructor(
        error: PersistenceErrorSource | RoutingDependencyError,
        decided: RoutingDecidedSoFar | null = null
    ) {
        // Another routing error passes on the cause it reports, other persistence errors their own
        // code.
        super(
            "A lookup needed for routing failed.",
            error,
            error instanceof RoutingDependencyError ? error.data.cause.code : error.code
        );
        this.decided = decided
            ? {
                  candidateTeamIds: [...decided.candidateTeamIds],
                  ruleId: decided.ruleId,
                  skips: decided.skips.map(skip => ({ ...skip }))
              }
            : null;
    }
}
