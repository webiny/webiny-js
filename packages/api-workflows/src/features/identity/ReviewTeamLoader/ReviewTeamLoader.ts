import DataLoader from "dataloader";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { Team } from "@webiny/api-core/types/security.js";
import { ReviewTeamLoader as Abstraction } from "./abstractions.js";

type TeamLookup = Result<Team | null, ListTeamsUseCase.Error>;

/**
 * Registered per request (`inContainerScope`), so the cache lives for one request. One loader per
 * tenant, as the team list is read in the current tenant. A failed list is not kept: its ids are
 * cleared, so a later call reads them again.
 */
class ReviewTeamLoaderImpl implements Abstraction.Interface {
    private readonly loaders = new Map<string, DataLoader<string, TeamLookup>>();

    public constructor(
        private identityContext: IdentityContext.Interface,
        private tenantContext: TenantContext.Interface,
        private listTeams: ListTeamsUseCase.Interface
    ) {}

    public async load(ids: string[]): Promise<Result<Team[], Abstraction.Error>> {
        const uniqueIds = [...new Set(ids)];
        if (uniqueIds.length === 0) {
            return Result.ok([]);
        }
        const tenantId = this.tenantContext.getTenant().id;
        let loader = this.loaders.get(tenantId);
        if (!loader) {
            loader = new DataLoader<string, TeamLookup>(keys => {
                return this.listByIds(keys);
            });
            this.loaders.set(tenantId, loader);
        }

        const lookups = await loader.loadMany(uniqueIds);
        const teams: Team[] = [];
        for (const lookup of lookups) {
            // The batch function never throws through the loader; a thrown error is rethrown.
            if (lookup instanceof Error) {
                throw lookup;
            }
            if (lookup.isFail()) {
                for (const id of uniqueIds) {
                    loader.clear(id);
                }
                return Result.fail(lookup.error);
            }
            if (lookup.value) {
                teams.push(lookup.value);
            }
        }
        return Result.ok(teams);
    }

    private async listByIds(ids: readonly string[]): Promise<TeamLookup[]> {
        // `ListTeamsUseCase` needs `security.team`, which a reviewer does not have.
        const listed = await this.identityContext.withoutAuthorization(() => {
            return this.listTeams.execute({ where: { id_in: [...ids] } });
        });
        if (listed.isFail()) {
            return ids.map(() => Result.fail(listed.error));
        }
        const byId = new Map(listed.value.map(team => [team.id, team]));
        return ids.map(id => Result.ok(byId.get(id) ?? null));
    }
}

export const ReviewTeamLoader = Abstraction.createImplementation({
    implementation: ReviewTeamLoaderImpl,
    dependencies: [IdentityContext, TenantContext, ListTeamsUseCase]
});
