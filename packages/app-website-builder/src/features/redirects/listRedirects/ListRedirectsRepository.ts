import {
    ListRedirectsRepository as RepositoryAbstraction,
    ListRedirectsGateway,
    type ListRedirectsGatewayParams,
    type ListRedirectsGatewayResult
} from "./abstractions.js";

class ListRedirectsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: ListRedirectsGateway.Interface) {}

    async execute(params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult> {
        return this.gateway.execute(params);
    }
}

export const ListRedirectsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListRedirectsRepositoryImpl,
    dependencies: [ListRedirectsGateway]
});
