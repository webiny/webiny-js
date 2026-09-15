import {
    CreateRemoteComponentUseCase as UseCaseAbstraction,
    CreateRemoteComponentRepository
} from "./abstractions.js";

class CreateRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateRemoteComponentRepository.Interface) {}

    async execute(input: UseCaseAbstraction.Input) {
        return this.repository.execute(input);
    }
}

export const CreateRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateRemoteComponentUseCaseImpl,
    dependencies: [CreateRemoteComponentRepository]
});
