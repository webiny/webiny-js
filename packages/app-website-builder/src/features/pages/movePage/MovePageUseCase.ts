import { MovePageUseCase as UseCaseAbstraction, MovePageRepository } from "./abstractions.js";

class MovePageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: MovePageRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(params.id, params.folderId);
    }
}

export const MovePageUseCase = UseCaseAbstraction.createImplementation({
    implementation: MovePageUseCaseImpl,
    dependencies: [MovePageRepository]
});
