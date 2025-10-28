import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetApiKeyByToken } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import type { ApiKey } from "../shared/types.js";

export class GetApiKeyByTokenUseCase implements GetApiKeyByToken.Interface {
    private repository: ApiKeysRepository.Interface;

    constructor(repository: ApiKeysRepository.Interface) {
        this.repository = repository;
    }

    async execute(token: string): Promise<Result<ApiKey | null, GetApiKeyByToken.Error>> {
        return this.repository.getByToken(token);
    }
}

export const GetApiKeyByTokenUseCaseImpl = createImplementation({
    abstraction: GetApiKeyByToken,
    implementation: GetApiKeyByTokenUseCase,
    dependencies: [ApiKeysRepository]
});
