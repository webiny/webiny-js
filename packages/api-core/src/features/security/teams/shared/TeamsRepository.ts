import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { TeamsRepository as RepositoryAbstraction } from "./abstractions.js";
import type { Team, GetTeamInput, ListTeamsInput } from "./types.js";
import { SecurityStorageOperations, TeamsProvider } from "~/features/shared/abstractions.js";
import { TeamNotFoundError, TeamStorageError } from "./errors.js";

class TeamsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private storageOperations: SecurityStorageOperations.Interface,
        private teamsProvider: TeamsProvider.Interface
    ) {}

    async get(params: GetTeamInput): Promise<Result<Team, RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // First check plugin teams
            const pluginTeams = await this.teamsProvider();
            const pluginTeam = pluginTeams.find(t => {
                // Match by ID or slug
                if (params.id && t.id === params.id) {
                    return true;
                }

                if (params.slug && t.slug === params.slug) {
                    return true;
                }

                return false;
            });

            // Filter by tenant if team has one
            if (pluginTeam) {
                if (!pluginTeam.tenant || pluginTeam.tenant === tenant.id) {
                    return Result.ok(pluginTeam);
                }
            }

            // Then check storage
            const team = await this.storageOperations.getTeam({
                where: {
                    ...params,
                    tenant: tenant.id
                }
            });

            if (team) {
                return Result.ok(team);
            }

            return Result.fail(new TeamNotFoundError());
        } catch (error) {
            return Result.fail(new TeamStorageError(error));
        }
    }

    async list(params: ListTeamsInput): Promise<Result<Team[], RepositoryAbstraction.Error>> {
        try {
            const tenant = this.tenantContext.getTenant();

            // Get teams from storage
            const teamsFromDatabase = await this.storageOperations.listTeams({
                where: {
                    tenant: tenant.id,
                    ...params.where
                },
                sort: params.sort || ["createdOn_ASC"]
            });

            // Get teams from plugins
            const pluginTeams = await this.teamsProvider();
            const teamsFromPlugins = pluginTeams.filter(team => {
                // Filter by tenant - plugin teams with no tenant or matching tenant
                if (team.tenant && team.tenant !== tenant.id) {
                    return false;
                }

                // Apply where filters if provided
                const { id_in, slug_in } = params.where || {};
                if (id_in && !id_in.includes(team.id)) {
                    return false;
                }
                if (slug_in && !slug_in.includes(team.slug)) {
                    return false;
                }

                return true;
            });

            // Plugin teams come first (they don't have createdOn), then database teams
            return Result.ok([...teamsFromPlugins, ...teamsFromDatabase]);
        } catch (error) {
            return Result.fail(new TeamStorageError(error));
        }
    }

    async create(team: Team): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.createTeam({ team });
            return Result.ok();
        } catch (error) {
            return Result.fail(new TeamStorageError(error));
        }
    }

    async update(team: Team): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            // Note: The old implementation passes both `original` and `team` to updateTeam.
            // We'll need to handle this in the use case layer.
            await this.storageOperations.updateTeam({ team, original: team });

            return Result.ok();
        } catch (error) {
            return Result.fail(new TeamStorageError(error));
        }
    }

    async delete(team: Team): Promise<Result<void, RepositoryAbstraction.Error>> {
        try {
            await this.storageOperations.deleteTeam({ team });
            return Result.ok();
        } catch (error) {
            return Result.fail(new TeamStorageError(error));
        }
    }
}

export const TeamsRepository = createImplementation({
    abstraction: RepositoryAbstraction,
    implementation: TeamsRepositoryImpl,
    dependencies: [TenantContext, SecurityStorageOperations, TeamsProvider]
});
