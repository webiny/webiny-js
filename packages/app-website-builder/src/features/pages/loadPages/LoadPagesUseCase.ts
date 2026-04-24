import { LoadPagesUseCase as UseCaseAbstraction, ListPagesRepository } from "./abstractions.js";

class LoadPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListPagesRepository.Interface) {}

    async execute({ folderId, resetSearch }: UseCaseAbstraction.Params) {
        await this.repository.loadPages({
            where: { location: { folderId } },
            resetSearch
        });
    }
}

export const LoadPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: LoadPagesUseCaseImpl,
    dependencies: [ListPagesRepository]
});
