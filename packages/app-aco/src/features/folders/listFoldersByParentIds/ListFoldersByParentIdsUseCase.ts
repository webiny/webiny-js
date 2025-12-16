import {
    ListFoldersByParentIdsUseCase as UseCaseAbstraction,
    ListFoldersByParentIdsRepository
} from "./abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";

class ListFoldersByParentIdsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListFoldersByParentIdsRepository.Interface) {}

    async execute(parentIds?: string[]) {
        await this.repository.execute(this.getParentIds(parentIds));
    }

    private getParentIds(parentIds?: string[]) {
        if (!parentIds) {
            return [ROOT_FOLDER];
        }

        return parentIds;
    }
}

export const ListFoldersByParentIdsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListFoldersByParentIdsUseCaseImpl,
    dependencies: [ListFoldersByParentIdsRepository]
});
