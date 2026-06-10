import {
    MoveRedirectUseCase as UseCaseAbstraction,
    MoveRedirectRepository,
    type MoveRedirectParams
} from "./abstractions.js";

class MoveRedirectUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: MoveRedirectRepository.Interface) {}

    async execute(params: MoveRedirectParams): Promise<void> {
        return this.repository.execute(params);
    }
}

export const MoveRedirectUseCase = UseCaseAbstraction.createImplementation({
    implementation: MoveRedirectUseCaseImpl,
    dependencies: [MoveRedirectRepository]
});
