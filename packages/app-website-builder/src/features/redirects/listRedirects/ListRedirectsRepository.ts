import {
    ListRedirectsRepository as RepositoryAbstraction,
    ListRedirectsGateway,
    type ListRedirectsGatewayParams,
    type ListRedirectsGatewayResult
} from "./abstractions.js";
import { RedirectsListCache } from "~/features/redirects/shared/abstractions.js";

class ListRedirectsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: ListRedirectsGateway.Interface,
        private cache: RedirectsListCache.Interface
    ) {}

    async execute(params: ListRedirectsGatewayParams): Promise<ListRedirectsGatewayResult> {
        const result = await this.gateway.execute(params);
        this.cache.addItems(result.data);
        return result;
    }
}

export const ListRedirectsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListRedirectsRepositoryImpl,
    dependencies: [ListRedirectsGateway, RedirectsListCache]
});
