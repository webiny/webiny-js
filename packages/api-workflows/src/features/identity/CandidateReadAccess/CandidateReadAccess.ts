import {
    AuthenticatedIdentity,
    IdentityContext,
    type Identity
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetUserUseCase } from "@webiny/api-core/features/users/GetUser/index.js";
import { CandidateReadAccess as Abstraction } from "./abstractions.js";

/**
 * The candidate's identity is built like the platform's own background identities
 * (`TaskControl`, `ExecuteScheduledActionUseCase`): an `admin` identity with tenant access, whose
 * roles and teams the authorizers load by id. Differences from a real login, accepted (A20):
 * - Only users stored as admin users of the current tenant are evaluated (one `GetUserUseCase`
 *   read, R68); anyone else is denied without a parent-tenant lookup. A user found here who has no
 *   roles in this tenant still gets `RolesTeamsAuthorizer`'s parent-tenant fallback, as at login.
 * - A custom identity provider's `canAccessTenant` rule is not re-run; the stored user record is
 *   the membership proof.
 * - Roles and teams are the stored ones, synced from the identity provider at the user's last
 *   login (`ExternalIdpUserSyncHandler`).
 * One identity object per tenant and user is kept for the request, so api-core's permission cache
 * (keyed by identity object and tenant, R69) loads each candidate once.
 */
class CandidateReadAccessImpl implements Abstraction.Interface {
    private readonly identities = new Map<string, Identity | null>();

    public constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private getUser: GetUserUseCase.Interface
    ) {}

    public async canUserRead(userId: string, check: () => Promise<boolean>): Promise<boolean> {
        try {
            const key = `${this.tenantContext.getTenant().id}:${userId}`;
            let identity: Identity | null;
            if (this.identities.has(key)) {
                identity = this.identities.get(key) ?? null;
            } else {
                // A membership lookup, not an access decision: read as the system.
                const user = await this.identityContext.withoutAuthorization(() => {
                    return this.getUser.execute({ id: userId });
                });
                identity = user.isOk()
                    ? new AuthenticatedIdentity({
                          id: user.value.id,
                          displayName: user.value.displayName,
                          type: "admin",
                          context: { canAccessTenant: true }
                      })
                    : null;
                this.identities.set(key, identity);
            }
            if (!identity) {
                return false;
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
    dependencies: [IdentityContext, TenantContext, GetUserUseCase]
});
