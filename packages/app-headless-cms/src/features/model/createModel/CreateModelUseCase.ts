import { CreateModelUseCase as UseCaseAbstraction, CreateModelRepository } from "./abstractions.js";
import type { CreateModelParams } from "./abstractions.js";

class CreateModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateModelRepository.Interface) {}

    async execute(data: CreateModelParams) {
        return this.repository.execute(data);
    }
}

export const CreateModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateModelUseCaseImpl,
    dependencies: [CreateModelRepository]
});
