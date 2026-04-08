import {
    GetModelGroupUseCase as UseCaseAbstraction,
    GetModelGroupRepository
} from "./abstractions.js";

class GetModelGroupUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetModelGroupRepository.Interface) {}

    async execute(id: string) {
        return this.repository.execute(id);
    }
}

export const GetModelGroupUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetModelGroupUseCaseImpl,
    dependencies: [GetModelGroupRepository]
});
