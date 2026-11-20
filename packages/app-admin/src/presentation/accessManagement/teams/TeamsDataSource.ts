import { LocalDataSource } from "~/presentation/listPresenter/LocalDataSource.js";
import type { Team } from "~/features/accessManagement/types.js";
import type { IListTeamsUseCase } from "~/features/accessManagement/teams/listTeams/abstractions.js";
import type { IListCache } from "~/features/listCache/index.js";

export class TeamsDataSource extends LocalDataSource<Team> {
    constructor(
        private listTeamsUseCase: IListTeamsUseCase,
        private cache: IListCache<Team>
    ) {
        super();
    }

    protected get items(): Team[] {
        return this.cache.getItems();
    }

    protected async load(): Promise<void> {
        await this.listTeamsUseCase.execute();
    }

    protected searchIn(team: Team): Array<string | null | undefined> {
        return [team.name, team.slug, team.description];
    }
}
