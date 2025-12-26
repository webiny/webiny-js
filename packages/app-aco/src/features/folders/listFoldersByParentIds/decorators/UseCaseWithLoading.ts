import { ListFoldersByParentIdsUseCase as UseCaseAbstraction } from "../abstractions.js";
import { FoldersLoadingRepository, LoadedFoldersCache } from "~/features/folders/abstractions.js";
import { LoadingActionsEnum } from "~/types.js";

class ListFoldersByParentIdsUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: FoldersLoadingRepository.Interface,
        private loadedCache: LoadedFoldersCache.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute(parentIds?: string[]) {
        let action: string = LoadingActionsEnum.init;

        if (parentIds?.length) {
            action = parentIds
                .filter(parentId => !this.loadedCache.getItems().includes(parentId))
                .join(":");
        }

        if (action) {
            await this.loadingRepository.runCallBack(this.decoratee.execute(parentIds), action);
        } else {
            await this.decoratee.execute(parentIds);
        }
    }
}

export const UseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: ListFoldersByParentIdsUseCaseWithLoadingImpl,
    dependencies: [FoldersLoadingRepository, LoadedFoldersCache]
});
