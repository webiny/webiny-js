import { SimpleDataSource } from "~/presentation/listPresenter/SimpleDataSource.js";
import type { IDataSourceQuery } from "~/presentation/listPresenter/abstractions.js";
import type { FetchResult } from "~/presentation/listPresenter/FolderAwareDataSource.js";
import type { ApiKey } from "~/features/accessManagement/types.js";
import type { IListApiKeysUseCase } from "~/features/accessManagement/apiKeys/listApiKeys/abstractions.js";
import type { IListCache } from "~/features/listCache/index.js";

export class ApiKeysDataSource extends SimpleDataSource<ApiKey> {
    constructor(
        private listApiKeysUseCase: IListApiKeysUseCase,
        private cache: IListCache<ApiKey>
    ) {
        super();
    }

    get rows(): ApiKey[] {
        return this.cache.getItems();
    }

    async fetch(_params: IDataSourceQuery): Promise<FetchResult<ApiKey>> {
        const result = await this.listApiKeysUseCase.execute();
        return {
            data: result.data,
            meta: { cursor: null, hasMoreItems: false, totalCount: result.data.length }
        };
    }
}
