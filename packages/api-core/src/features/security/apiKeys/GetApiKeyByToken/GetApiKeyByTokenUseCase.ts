import { GetApiKeyByTokenUseCase as GetApiKeyByTokenUseCaseAbstraction } from "./abstractions.js";
import { ApiKeysRepository } from "../shared/abstractions.js";

class GetApiKeyByTokenUseCaseImpl implements GetApiKeyByTokenUseCaseAbstraction.Interface {
    constructor(private repository: ApiKeysRepository.Interface) {}

    async execute(token: string) {
        return this.repository.getByToken(token);
    }
}

export const GetApiKeyByTokenUseCase = GetApiKeyByTokenUseCaseAbstraction.createImplementation({
    implementation: GetApiKeyByTokenUseCaseImpl,
    dependencies: [ApiKeysRepository]
});
