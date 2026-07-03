import {
    ListApiKeysRepository as RepositoryAbstraction,
    ListApiKeysGateway,
    ApiKeysListCache,
    type IListApiKeysGatewayResult
} from "./abstractions.js";

class ListApiKeysRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: ListApiKeysGateway.Interface,
        private cache: ApiKeysListCache.Interface
    ) {}

    async execute(): Promise<IListApiKeysGatewayResult> {
        const result = await this.gateway.execute();
        this.cache.setItems(result.data);
        return result;
    }
}

export const ListApiKeysRepository = RepositoryAbstraction.createImplementation({
    implementation: ListApiKeysRepositoryImpl,
    dependencies: [ListApiKeysGateway, ApiKeysListCache]
});
