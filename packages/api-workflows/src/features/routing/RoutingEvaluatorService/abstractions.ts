import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type {
    RoutingEvaluateParams,
    RoutingEvaluation,
    RoutingMember,
    RoutingMembersParams,
    RoutingUserCheck,
    RoutingUserCheckParams
} from "~/domain/routing/types.js";

export interface IRoutingEvaluatorService {
    /**
     * Who gets the step (spec 6, R110): pick, then the first matching rule with a valid target,
     * then the strategy over the candidates, then the pool. Skips and the outcome are in
     * `records`, evaluated rules in `trace`.
     */
    evaluate(
        params: RoutingEvaluateParams
    ): Promise<Result<RoutingEvaluation, RoutingDependencyError>>;
    /** Every member of the teams except the requester, by user id, with exclusion and access. */
    listMembers(
        params: RoutingMembersParams
    ): Promise<Result<RoutingMember[], RoutingDependencyError>>;
    /** Whether one user is a valid person target (R112): pick, rule user target, reassign. */
    checkUser(
        params: RoutingUserCheckParams
    ): Promise<Result<RoutingUserCheck, RoutingDependencyError>>;
}

/**
 * The routing rules in one place, for the step-reach resolver, the inspector, the candidate lists
 * and reassign (spec 6). Internal: no permission checks (D132). User lookups run without
 * authorization; read checks run as the request identity (SEC-66). A failed lookup fails with
 * `RoutingDependencyError`; a throwing port propagates. Callers decide what a failure means (the
 * resolver falls through to the pool, R116).
 */
export const RoutingEvaluatorService =
    createAbstraction<IRoutingEvaluatorService>("RoutingEvaluatorService");

export namespace RoutingEvaluatorService {
    export type Interface = IRoutingEvaluatorService;
    export type EvaluateParams = RoutingEvaluateParams;
    export type Evaluation = RoutingEvaluation;
    export type MembersParams = RoutingMembersParams;
    export type Member = RoutingMember;
    export type UserCheckParams = RoutingUserCheckParams;
    export type UserCheck = RoutingUserCheck;
    export type Error = RoutingDependencyError;
    export type EvaluateReturn = Promise<Result<RoutingEvaluation, RoutingDependencyError>>;
    export type MembersReturn = Promise<Result<RoutingMember[], RoutingDependencyError>>;
    export type UserCheckReturn = Promise<Result<RoutingUserCheck, RoutingDependencyError>>;
}
