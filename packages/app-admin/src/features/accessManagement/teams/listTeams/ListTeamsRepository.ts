import {
    ListTeamsRepository as RepositoryAbstraction,
    ListTeamsGateway,
    TeamsListCache,
    type IListTeamsGatewayResult
} from "./abstractions.js";

class ListTeamsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: ListTeamsGateway.Interface,
        private cache: TeamsListCache.Interface
    ) {}

    async execute(): Promise<IListTeamsGatewayResult> {
        const result = await this.gateway.execute();
        this.cache.setItems(result.data);
        return result;
    }
}

export const ListTeamsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListTeamsRepositoryImpl,
    dependencies: [ListTeamsGateway, TeamsListCache]
});
