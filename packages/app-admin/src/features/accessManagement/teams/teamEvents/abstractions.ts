import { createAbstraction } from "@webiny/feature/admin";

export interface IRefreshTeamInCacheRepository {
    execute(id: string): Promise<void>;
}

/** Reads a team back by id and puts it into the teams list, replacing the copy the list has. */
export const RefreshTeamInCacheRepository = createAbstraction<IRefreshTeamInCacheRepository>(
    "AccessManagement/RefreshTeamInCacheRepository"
);

export namespace RefreshTeamInCacheRepository {
    export type Interface = IRefreshTeamInCacheRepository;
}
