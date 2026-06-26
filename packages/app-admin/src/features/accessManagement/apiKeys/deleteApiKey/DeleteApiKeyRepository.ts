import { ApiKeysListCache } from "../listApiKeys/abstractions.js";
import {
    DeleteApiKeyRepository as RepositoryAbstraction,
    DeleteApiKeyGateway
} from "./abstractions.js";

class DeleteApiKeyRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: DeleteApiKeyGateway.Interface,
        private cache: ApiKeysListCache.Interface
    ) {}

    async execute(id: string): Promise<void> {
        await this.gateway.execute(id);
        this.cache.removeItems(item => item.id === id);
    }
}

export const DeleteApiKeyRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteApiKeyRepositoryImpl,
    dependencies: [DeleteApiKeyGateway, ApiKeysListCache]
});
