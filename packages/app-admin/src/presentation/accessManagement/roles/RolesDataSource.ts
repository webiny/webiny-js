import { SimpleDataSource } from "~/presentation/listPresenter/SimpleDataSource.js";
import type { IDataSourceQuery } from "~/presentation/listPresenter/abstractions.js";
import type { FetchResult } from "~/presentation/listPresenter/FolderAwareDataSource.js";
import type { Role } from "~/features/accessManagement/types.js";
import type { IListRolesUseCase } from "~/features/accessManagement/roles/listRoles/abstractions.js";
import type { IListCache } from "~/features/listCache/index.js";

export class RolesDataSource extends SimpleDataSource<Role> {
    constructor(
        private listRolesUseCase: IListRolesUseCase,
        private cache: IListCache<Role>
    ) {
        super();
    }

    get rows(): Role[] {
        return this.cache.getItems();
    }

    async fetch(_params: IDataSourceQuery): Promise<FetchResult<Role>> {
        const result = await this.listRolesUseCase.execute();
        return {
            data: result.data,
            meta: { cursor: null, hasMoreItems: false, totalCount: result.data.length }
        };
    }
}
