import { Result } from "@webiny/feature/api";
import { GetApiKeyBySlug } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";
import type { ApiKey } from "../shared/types.js";

export class GetApiKeyBySlugUseCase implements GetApiKeyBySlug.Interface {
    private repository: ApiKeysRepository.Interface;

    constructor(repository: ApiKeysRepository.Interface) {
        this.repository = repository;
    }

    async execute(slug: string): Promise<Result<ApiKey | null, GetApiKeyBySlug.Error>> {
        return this.repository.getBySlug(slug);
    }
}

export const GetApiKeyBySlugUseCaseImpl = GetApiKeyBySlug.createImplementation({
    implementation: GetApiKeyBySlugUseCase,
    dependencies: [ApiKeysRepository]
});
