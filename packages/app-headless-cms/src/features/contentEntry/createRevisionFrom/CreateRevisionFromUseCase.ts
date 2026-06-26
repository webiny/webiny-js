import {
    CreateRevisionFromUseCase as UseCaseAbstraction,
    CreateRevisionFromRepository
} from "./abstractions.js";
import type { ICreateRevisionFromParams } from "./abstractions.js";

class CreateRevisionFromUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateRevisionFromRepository.Interface) {}

    async execute(params: ICreateRevisionFromParams) {
        return this.repository.execute(params);
    }
}

export const CreateRevisionFromUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateRevisionFromUseCaseImpl,
    dependencies: [CreateRevisionFromRepository]
});
