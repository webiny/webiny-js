import type { ApiKey } from "../../types.js";
import { GetApiKeyUseCase as UseCaseAbstraction, GetApiKeyRepository } from "./abstractions.js";

class GetApiKeyUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetApiKeyRepository.Interface) {}

    async execute(id: string): Promise<ApiKey> {
        return this.repository.execute(id);
    }
}

export const GetApiKeyUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetApiKeyUseCaseImpl,
    dependencies: [GetApiKeyRepository]
});
