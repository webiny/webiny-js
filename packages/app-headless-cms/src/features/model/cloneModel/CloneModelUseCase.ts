import { CloneModelUseCase as UseCaseAbstraction, CloneModelRepository } from "./abstractions.js";
import type { CloneModelParams } from "./abstractions.js";

class CloneModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CloneModelRepository.Interface) {}

    async execute(params: CloneModelParams) {
        return this.repository.execute(params);
    }
}

export const CloneModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: CloneModelUseCaseImpl,
    dependencies: [CloneModelRepository]
});
