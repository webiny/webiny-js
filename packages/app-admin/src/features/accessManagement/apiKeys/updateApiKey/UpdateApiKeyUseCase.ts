import type { ApiKey } from "../../types.js";
import {
    UpdateApiKeyUseCase as UseCaseAbstraction,
    UpdateApiKeyRepository,
    type IUpdateApiKeyData
} from "./abstractions.js";

class UpdateApiKeyUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateApiKeyRepository.Interface) {}

    async execute(id: string, data: IUpdateApiKeyData): Promise<ApiKey> {
        return this.repository.execute(id, data);
    }
}

export const UpdateApiKeyUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateApiKeyUseCaseImpl,
    dependencies: [UpdateApiKeyRepository]
});
