import {
    AuthenticatedIdentity,
    IdentityContext,
    type Identity
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CandidateReadAccess as Abstraction } from "./abstractions.js";

/**
 * The candidate's identity is built like the platform's own background identities
 * (`TaskControl`, `ExecuteScheduledActionUseCase`): an `admin` identity with tenant access, whose
 * roles and teams the authorizers load by id. Differences from a real login, accepted (A20):
 * - Only users listed as admin users of the current tenant are evaluated: the caller passes the
 *   user it listed (R68), so nothing is read here. A user without roles in this tenant still gets
 *   `RolesTeamsAuthorizer`'s parent-tenant fallback, as at login.
 * - A custom identity provider's `canAccessTenant` rule is not re-run; the stored user record is
 *   the membership proof.
 * - Roles and teams are the stored ones, synced from the identity provider at the user's last
 *   login (`ExternalIdpUserSyncHandler`).
 * One identity object per tenant and user is kept for the request, so api-core's permission cache
 * (keyed by identity object and tenant, R69) loads each candidate once.
 */
class CandidateReadAccessImpl implements Abstraction.Interface {
    private readonly identities = new Map<string, Identity>();

    public constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    public async canUserRead(
        user: Abstraction.User,
        check: () => Promise<boolean>
    ): Promise<boolean> {
        try {
            const key = `${this.tenantContext.getTenant().id}:${user.id}`;
            let identity = this.identities.get(key);
            if (!identity) {
                identity = new AuthenticatedIdentity({
                    id: user.id,
                    displayName: user.displayName,
                    type: "admin",
                    context: { canAccessTenant: true }
                });
                this.identities.set(key, identity);
            }
            return await this.identityContext.withIdentity(identity, () => {
                return this.identityContext.withAuthorization(check);
            });
        } catch {
            return false;
        }
    }
}

export const CandidateReadAccess = Abstraction.createImplementation({
    implementation: CandidateReadAccessImpl,
    dependencies: [IdentityContext, TenantContext]
});
