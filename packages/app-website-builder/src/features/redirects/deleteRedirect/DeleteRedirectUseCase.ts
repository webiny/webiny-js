import {
    DeleteRedirectUseCase as UseCaseAbstraction,
    DeleteRedirectRepository,
    type DeleteRedirectParams
} from "./abstractions.js";

class DeleteRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteRedirectRepository.Interface) {}

    async execute(params: DeleteRedirectParams): Promise<void> {
        return this.repository.execute(params);
    }
}

export const DeleteRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteRedirectUseCaseImpl,
    dependencies: [DeleteRedirectRepository]
});
