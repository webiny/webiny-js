import { Result } from "@webiny/feature/api";
import { GetApiKeyBySlugUseCase as GetApiKeyBySlugUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import type { ApiKey } from "../shared/types.js";

class GetApiKeyBySlugUseCaseImpl implements GetApiKeyBySlugUseCaseAbstraction.Interface {
    private repository: ApiKeysRepository.Interface;

    constructor(repository: ApiKeysRepository.Interface) {
        this.repository = repository;
    }

    async execute(
        slug: string
    ): Promise<Result<ApiKey | null, GetApiKeyBySlugUseCaseAbstraction.Error>> {
        return this.repository.getBySlug(slug);
    }
}

export const GetApiKeyBySlugUseCase = GetApiKeyBySlugUseCaseAbstraction.createImplementation({
    implementation: GetApiKeyBySlugUseCaseImpl,
    dependencies: [ApiKeysRepository]
});
