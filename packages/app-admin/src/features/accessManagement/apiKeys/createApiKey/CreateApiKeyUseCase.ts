import type { ApiKey } from "../../types.js";
import {
    CreateApiKeyUseCase as UseCaseAbstraction,
    CreateApiKeyRepository,
    type ICreateApiKeyData
} from "./abstractions.js";

class CreateApiKeyUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateApiKeyRepository.Interface) {}

    async execute(data: ICreateApiKeyData): Promise<ApiKey> {
        return this.repository.execute(data);
    }
}

export const CreateApiKeyUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateApiKeyUseCaseImpl,
    dependencies: [CreateApiKeyRepository]
});
