import type { ApiKey } from "../../types.js";
import { ApiKeysListCache } from "../listApiKeys/abstractions.js";
import {
    UpdateApiKeyRepository as RepositoryAbstraction,
    UpdateApiKeyGateway,
    type IUpdateApiKeyData
} from "./abstractions.js";

class UpdateApiKeyRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: UpdateApiKeyGateway.Interface,
        private cache: ApiKeysListCache.Interface
    ) {}

    async execute(id: string, data: IUpdateApiKeyData): Promise<ApiKey> {
        const apiKey = await this.gateway.execute(id, data);
        this.cache.updateItems(item => (item.id === apiKey.id ? apiKey : item));
        return apiKey;
    }
}

export const UpdateApiKeyRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateApiKeyRepositoryImpl,
    dependencies: [UpdateApiKeyGateway, ApiKeysListCache]
});
