import {
    CreateModelGroupUseCase as UseCaseAbstraction,
    CreateModelGroupRepository
} from "./abstractions.js";

class CreateModelGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CreateModelGroupRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        return this.repository.execute(params);
    }
}

export const CreateModelGroupUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateModelGroupUseCaseImpl,
    dependencies: [CreateModelGroupRepository]
});
