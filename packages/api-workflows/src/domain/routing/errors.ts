import { BaseError } from "@webiny/feature/api";
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { PersistenceErrorSource } from "~/domain/PersistenceErrorSource.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

/** The failed lookup's code only; its text stays on the server. */
export interface RoutingDependencyErrorCause {
    code?: string;
}

export interface RoutingDependencyErrorData {
    cause: RoutingDependencyErrorCause;
}

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
export class RoutingDependencyError extends BaseError<RoutingDependencyErrorData> {
    override readonly code = "Workflows/Routing/Dependency" as const;
    public readonly decided: RoutingDecidedSoFar | null;
    /** The raw lookup error, for server logs only; never sent to a client (R146). */
    declare public readonly source: PersistenceErrorSource;

    /** Pass another `RoutingDependencyError` to keep its cause and add what was decided. */
    constructor(
        error: PersistenceErrorSource | RoutingDependencyError,
        decided: RoutingDecidedSoFar | null = null
    ) {
        // Another routing error passes on its cause's code, other persistence errors their own.
        const code = error instanceof RoutingDependencyError ? error.source.code : error.code;
        // A wrapped persistence error passes on its raw cause.
        const source = hasErrorSource(error) ? error.source : error;
        super({
            message: "A lookup needed for routing failed.",
            data: { cause: { code } }
        });
        // Not enumerable: serialising the error never includes it.
        Object.defineProperty(this, "source", { value: source, enumerable: false });
        this.decided = decided
            ? {
                  candidateTeamIds: [...decided.candidateTeamIds],
                  ruleId: decided.ruleId,
                  skips: decided.skips.map(skip => ({ ...skip }))
              }
            : null;
    }
}
