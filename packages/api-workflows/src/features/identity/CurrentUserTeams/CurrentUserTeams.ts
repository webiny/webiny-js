import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { CurrentUserTeams as Abstraction } from "./abstractions.js";

/**
 * Registered as a singleton in the request container, so the cache lives for one request (like
 * the removed `GetUserTeams`). Keyed by tenant and identity id because `withIdentity` can switch the
 * identity and `withTenant` the tenant mid-request, and teams belong to a tenant. Only successful lookups are cached: a failed one returns `[]` (fail closed) and
 * is retried on the next call.
 */
class CurrentUserTeamsImpl implements Abstraction.Interface {
    private readonly cache = new Map<string, string[]>();

    public constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface
    ) {}

    public async getTeamIds(): Promise<string[]> {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return [];
        }

        const key = `${this.tenantContext.getTenant().id}:${identity.id}`;
        const cached = this.cache.get(key);
        if (cached) {
            return [...cached];
        }

        const result = await this.listUserTeams.execute(identity.id);
        if (result.isFail()) {
            return [];
        }

        const teamIds = result.value.map(team => team.id);
        this.cache.set(key, teamIds);
        return [...teamIds];
    }
}

export const CurrentUserTeams = Abstraction.createImplementation({
    implementation: CurrentUserTeamsImpl,
    dependencies: [IdentityContext, TenantContext, ListUserTeamsUseCase]
});
