import {
    UpdateModelGroupUseCase as UseCaseAbstraction,
    UpdateModelGroupRepository
} from "./abstractions.js";

class UpdateModelGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateModelGroupRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        return this.repository.execute(params);
    }
}

export const UpdateModelGroupUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateModelGroupUseCaseImpl,
    dependencies: [UpdateModelGroupRepository]
});
