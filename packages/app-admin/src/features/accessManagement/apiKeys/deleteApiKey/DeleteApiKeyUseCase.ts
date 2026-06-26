import {
    DeleteApiKeyUseCase as UseCaseAbstraction,
    DeleteApiKeyRepository
} from "./abstractions.js";

class DeleteApiKeyUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteApiKeyRepository.Interface) {}

    async execute(id: string): Promise<void> {
        return this.repository.execute(id);
    }
}

export const DeleteApiKeyUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteApiKeyUseCaseImpl,
    dependencies: [DeleteApiKeyRepository]
});
