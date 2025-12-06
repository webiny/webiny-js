import {
    GetFolderAncestorsUseCase as UseCaseAbstraction,
    GetFolderAncestorsRepository
} from "./abstractions.js";

class GetFolderAncestorsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetFolderAncestorsRepository.Interface) {}

    execute(id: string) {
        return this.repository.execute(id);
    }
}

export const GetFolderAncestorsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFolderAncestorsUseCaseImpl,
    dependencies: [GetFolderAncestorsRepository]
});
