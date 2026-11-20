import {
    SaveGlobalComponentUseCase as UseCaseAbstraction,
    SaveGlobalComponentRepository
} from "./abstractions.js";

class SaveGlobalComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: SaveGlobalComponentRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.repository.execute(params.globalComponent);
    }
}

export const SaveGlobalComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: SaveGlobalComponentUseCaseImpl,
    dependencies: [SaveGlobalComponentRepository]
});
