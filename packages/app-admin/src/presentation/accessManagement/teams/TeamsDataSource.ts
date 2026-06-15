import { SimpleDataSource } from "~/presentation/listPresenter/SimpleDataSource.js";
import type { IDataSourceQuery } from "~/presentation/listPresenter/abstractions.js";
import type { FetchResult } from "~/presentation/listPresenter/FolderAwareDataSource.js";
import type { Team } from "~/features/accessManagement/types.js";
import type { IListTeamsUseCase } from "~/features/accessManagement/teams/listTeams/abstractions.js";
import type { IListCache } from "~/features/listCache/index.js";

export class TeamsDataSource extends SimpleDataSource<Team> {
    constructor(
        private listTeamsUseCase: IListTeamsUseCase,
        private cache: IListCache<Team>
    ) {
        super();
    }

    get rows(): Team[] {
        return this.cache.getItems();
    }

    async fetch(_params: IDataSourceQuery): Promise<FetchResult<Team>> {
        const result = await this.listTeamsUseCase.execute();
        return {
            data: result.data,
            meta: { cursor: null, hasMoreItems: false, totalCount: result.data.length }
        };
    }
}
