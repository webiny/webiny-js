import { AuthenticatedIdentity } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { Actor } from "~/domain/review/types.js";

/**
 * The identity an automation step runs as (D58, D87, R149, R161): the review's requester, with
 * the requester's identity type (`admin` when it has none) and tenant access. The trigger and
 * the run handler both use it, so the task's `createdBy` and the handler's identity match.
 * Pure.
 */
export const getRequesterIdentity = (requester: Actor): AuthenticatedIdentity => {
    return new AuthenticatedIdentity({
        id: requester.id,
        displayName: requester.displayName,
        type: requester.identityType ?? "admin",
        context: { canAccessTenant: true }
    });
};
