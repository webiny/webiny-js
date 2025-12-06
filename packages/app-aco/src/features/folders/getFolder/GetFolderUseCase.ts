import {
    GetFolderUseCase as UseCaseAbstraction,
    GetFolderRepository
} from "./abstractions.js";

class GetFolderUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetFolderRepository.Interface) {}

    async execute(id: string) {
        await this.repository.execute(id);
    }
}

export const GetFolderUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFolderUseCaseImpl,
    dependencies: [GetFolderRepository]
});
