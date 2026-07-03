import type { ApiKey } from "../../types.js";
import { GetApiKeyRepository as RepositoryAbstraction, GetApiKeyGateway } from "./abstractions.js";

class GetApiKeyRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: GetApiKeyGateway.Interface) {}

    async execute(id: string): Promise<ApiKey> {
        return this.gateway.execute(id);
    }
}

export const GetApiKeyRepository = RepositoryAbstraction.createImplementation({
    implementation: GetApiKeyRepositoryImpl,
    dependencies: [GetApiKeyGateway]
});
