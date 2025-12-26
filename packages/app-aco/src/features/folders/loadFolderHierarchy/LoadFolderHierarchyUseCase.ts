import {
    LoadFolderHierarchyUseCase as UseCaseAbstraction,
    LoadFolderHierarchyRepository
} from "./abstractions.js";

class LoadFolderHierarchyUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LoadFolderHierarchyRepository.Interface) {}

    async execute(id: string) {
        await this.repository.execute(id);
    }
}

export const LoadFolderHierarchyUseCase = UseCaseAbstraction.createImplementation({
    implementation: LoadFolderHierarchyUseCaseImpl,
    dependencies: [LoadFolderHierarchyRepository]
});
