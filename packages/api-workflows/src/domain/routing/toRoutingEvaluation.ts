import type { AssignmentDecision } from "~/domain/assignment/types.js";
import type { RoutingStrategy } from "~/domain/workflow/types.js";
import type {
    RoutingEvaluation,
    RoutingSkippedUser,
    RoutingSource,
    RoutingTraceEntry,
    RoutingUser
} from "./types.js";

export interface RoutingDecisionInput {
    owner: RoutingUser | null;
    source: RoutingSource;
    ruleId: string | null;
    strategy: RoutingStrategy;
    candidateTeamIds: string[];
    reason: string | null;
    /** The skips so far, in decision order. */
    skips: AssignmentDecision[];
    trace: RoutingTraceEntry[];
    /** The skipped people so far, in decision order (R129). */
    skipped: RoutingSkippedUser[];
    /** The strategy's candidate order; given only in inspector mode when a strategy ran (R289). */
    strategyOrder?: RoutingUser[];
}

/** The evaluation with its outcome record appended after the skips (R117). Pure. */
export const toRoutingEvaluation = (input: RoutingDecisionInput): RoutingEvaluation => {
    const evaluation: RoutingEvaluation = {
        owner: input.owner ? { ...input.owner } : null,
        source: input.source,
        ruleId: input.ruleId,
        strategy: input.strategy,
        candidateTeamIds: [...input.candidateTeamIds],
        reason: input.reason,
        records: [
            ...input.skips.map(skip => ({ ...skip })),
            {
                kind: "outcome",
                userId: input.owner?.id ?? null,
                source: input.source,
                ruleId: input.ruleId,
                by: null,
                reason: input.reason
            }
        ],
        trace: input.trace.map(entry => ({ ...entry })),
        skipped: input.skipped.map(item => ({ ...item }))
    };
    if (input.strategyOrder) {
        evaluation.strategyOrder = input.strategyOrder.map(user => ({ ...user }));
    }
    return evaluation;
};
