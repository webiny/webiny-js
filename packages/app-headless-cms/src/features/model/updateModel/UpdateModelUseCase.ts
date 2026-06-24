import { UpdateModelUseCase as UseCaseAbstraction, UpdateModelRepository } from "./abstractions.js";
import type { UpdateModelParams } from "./abstractions.js";

class UpdateModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateModelRepository.Interface) {}

    async execute(params: UpdateModelParams) {
        return this.repository.execute(params);
    }
}

export const UpdateModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateModelUseCaseImpl,
    dependencies: [UpdateModelRepository]
});
