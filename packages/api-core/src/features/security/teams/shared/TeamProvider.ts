import { TeamsProvider } from "~/features/security/shared/abstractions.js";
import { TeamFactory } from "./abstractions.js";
import type { Team } from "./types.js";

class TeamProviderImpl implements TeamsProvider.Interface {
    private cache: Team[] | undefined;

    constructor(private teamFactories: TeamFactory.Interface[]) {}

    async getTeams(): Promise<Team[]> {
        if (this.cache === undefined) {
            const results = await Promise.all(this.teamFactories.map(factory => factory.execute()));
            this.cache = results.flat().map<Team>(codeTeam => ({
                ...codeTeam,
                id: codeTeam.slug,
                createdOn: null,
                createdBy: null,
                system: codeTeam.system ?? false,
                plugin: true
            }));
        }

        return this.cache;
    }
}

export const TeamProvider = TeamsProvider.createImplementation({
    implementation: TeamProviderImpl,
    dependencies: [[TeamFactory, { multiple: true }]]
});
