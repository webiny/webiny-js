import { GetApiKeyBySlugUseCase as GetApiKeyBySlugUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";

class GetApiKeyBySlugUseCaseImpl implements GetApiKeyBySlugUseCaseAbstraction.Interface {
    constructor(private repository: ApiKeysRepository.Interface) {}

    async execute(slug: string) {
        return this.repository.getBySlug(slug);
    }
}

export const GetApiKeyBySlugUseCase = GetApiKeyBySlugUseCaseAbstraction.createImplementation({
    implementation: GetApiKeyBySlugUseCaseImpl,
    dependencies: [ApiKeysRepository]
});
