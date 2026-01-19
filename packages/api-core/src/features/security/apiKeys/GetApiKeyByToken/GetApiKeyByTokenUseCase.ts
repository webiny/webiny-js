import { Result } from "@webiny/feature/api";
import { GetApiKeyByTokenUseCase as GetApiKeyByTokenUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import type { ApiKey } from "../shared/types.js";

class GetApiKeyByTokenUseCaseImpl implements GetApiKeyByTokenUseCaseAbstraction.Interface {
    private repository: ApiKeysRepository.Interface;

    constructor(repository: ApiKeysRepository.Interface) {
        this.repository = repository;
    }

    async execute(
        token: string
    ): Promise<Result<ApiKey | null, GetApiKeyByTokenUseCaseAbstraction.Error>> {
        return this.repository.getByToken(token);
    }
}

export const GetApiKeyByTokenUseCase = GetApiKeyByTokenUseCaseAbstraction.createImplementation({
    implementation: GetApiKeyByTokenUseCaseImpl,
    dependencies: [ApiKeysRepository]
});
