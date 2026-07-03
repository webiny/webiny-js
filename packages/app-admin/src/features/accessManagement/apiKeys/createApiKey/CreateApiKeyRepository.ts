import type { ApiKey } from "../../types.js";
import { ApiKeysListCache } from "../listApiKeys/abstractions.js";
import {
    CreateApiKeyRepository as RepositoryAbstraction,
    CreateApiKeyGateway,
    type ICreateApiKeyData
} from "./abstractions.js";

class CreateApiKeyRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private gateway: CreateApiKeyGateway.Interface,
        private cache: ApiKeysListCache.Interface
    ) {}

    async execute(data: ICreateApiKeyData): Promise<ApiKey> {
        const apiKey = await this.gateway.execute(data);
        this.cache.addItems([apiKey]);
        return apiKey;
    }
}

export const CreateApiKeyRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateApiKeyRepositoryImpl,
    dependencies: [CreateApiKeyGateway, ApiKeysListCache]
});
