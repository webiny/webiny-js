import {
    ListRolesRepository as RepositoryAbstraction,
    ListRolesGateway,
    RolesListCache,
    type IListRolesGatewayResult
} from "./abstractions.js";

class ListRolesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: ListRolesGateway.Interface,
        private cache: RolesListCache.Interface
    ) {}

    async execute(): Promise<IListRolesGatewayResult> {
        const result = await this.gateway.execute();
        this.cache.setItems(result.data);
        return result;
    }
}

export const ListRolesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListRolesRepositoryImpl,
    dependencies: [ListRolesGateway, RolesListCache]
});
