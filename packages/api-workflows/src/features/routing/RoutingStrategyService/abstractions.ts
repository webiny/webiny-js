import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { RoutingStrategyName, RoutingUser } from "~/domain/routing/types.js";

export interface RoutingStrategyOrderParams {
    strategy: RoutingStrategyName;
    /** Eligible candidates in their stable order, sorted by user id (R111). */
    candidates: RoutingUser[];
    /** The review's namespace; least loaded counts load in the same app only (D137). */
    model: string;
    /** `null` for a workflow not stored yet: round robin has no history. */
    workflowId: string | null;
    /**
     * The review being routed: least loaded does not count it as load, so a candidate who owned
     * its previous step is not penalised by this very review. `null` without a review.
     */
    reviewId: string | null;
    stepId: string;
}

export interface IRoutingStrategyService {
    order(
        params: RoutingStrategyOrderParams
    ): Promise<Result<RoutingUser[], RoutingDependencyError>>;
}

/**
 * The order in which a strategy asks the candidates (R115): round robin after the step's last
 * assignee, least loaded by in-review load per app with the least recently assigned first among
 * the candidates tied at the lowest load (one latest-outcome read per such candidate). The
 * evaluator checks read access lazily in this order. Load and history are read from
 * the list index and can lag (A29, A46).
 */
export const RoutingStrategyService =
    createAbstraction<IRoutingStrategyService>("RoutingStrategyService");

export namespace RoutingStrategyService {
    export type Interface = IRoutingStrategyService;
    export type OrderParams = RoutingStrategyOrderParams;
    export type Return = Promise<Result<RoutingUser[], RoutingDependencyError>>;
}
