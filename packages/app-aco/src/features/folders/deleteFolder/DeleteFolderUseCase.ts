import {
    DeleteFolderUseCase as UseCaseAbstraction,
    DeleteFolderRepository
} from "./abstractions.js";

class DeleteFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: DeleteFolderRepository.Interface) {}

    async execute(id: string) {
        await this.repository.execute(id);
    }
}

export const DeleteFolderUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteFolderUseCaseImpl,
    dependencies: [DeleteFolderRepository]
});
