import {
    DeleteRemoteComponentUseCase as UseCaseAbstraction,
    DeleteRemoteComponentRepository
} from "./abstractions.js";

class DeleteRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteRemoteComponentRepository.Interface) {}

    async execute(id: string) {
        return this.repository.execute(id);
    }
}

export const DeleteRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteRemoteComponentUseCaseImpl,
    dependencies: [DeleteRemoteComponentRepository]
});
