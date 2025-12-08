import { ListFoldersUseCase as UseCaseAbstraction, ListFoldersRepository } from "./abstractions.js";

class ListFoldersUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListFoldersRepository.Interface) {}

    async execute() {
        await this.repository.execute();
    }
}

export const ListFoldersUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListFoldersUseCaseImpl,
    dependencies: [ListFoldersRepository]
});
