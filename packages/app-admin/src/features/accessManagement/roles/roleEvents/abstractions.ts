import { createAbstraction } from "@webiny/feature/admin";

export interface IRefreshRoleInCacheRepository {
    execute(id: string): Promise<void>;
}

/** Reads a role back by id and puts it into the roles list, replacing the copy the list has. */
export const RefreshRoleInCacheRepository = createAbstraction<IRefreshRoleInCacheRepository>(
    "AccessManagement/RefreshRoleInCacheRepository"
);

export namespace RefreshRoleInCacheRepository {
    export type Interface = IRefreshRoleInCacheRepository;
}
