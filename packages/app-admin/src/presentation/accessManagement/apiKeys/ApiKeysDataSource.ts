import { LocalDataSource } from "~/presentation/listPresenter/LocalDataSource.js";
import type { ApiKey } from "~/features/accessManagement/types.js";
import type { IListApiKeysUseCase } from "~/features/accessManagement/apiKeys/listApiKeys/abstractions.js";
import type { IListCache } from "~/features/listCache/index.js";

export class ApiKeysDataSource extends LocalDataSource<ApiKey> {
    constructor(
        private listApiKeysUseCase: IListApiKeysUseCase,
        private cache: IListCache<ApiKey>
    ) {
        super();
    }

    protected get items(): ApiKey[] {
        return this.cache.getItems();
    }

    protected async load(): Promise<void> {
        await this.listApiKeysUseCase.execute();
    }

    protected searchIn(apiKey: ApiKey): Array<string | null | undefined> {
        return [apiKey.name, apiKey.slug, apiKey.description];
    }
}
