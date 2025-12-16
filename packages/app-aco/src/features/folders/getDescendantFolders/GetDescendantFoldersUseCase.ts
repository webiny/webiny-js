import {
    GetDescendantFoldersUseCase as UseCaseAbstraction,
    GetDescendantFoldersRepository
} from "./abstractions.js";

class GetDescendantFoldersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetDescendantFoldersRepository.Interface) {}

    execute(id: string) {
        return this.repository.execute(id);
    }
}

export const GetDescendantFoldersUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetDescendantFoldersUseCaseImpl,
    dependencies: [GetDescendantFoldersRepository]
});
