import { FoldersLoadingRepository } from "../abstractions.js";
import { LoadFolderHierarchyUseCase as UseCaseAbstraction } from "./abstractions.js";
import { LoadingActionsEnum } from "~/types.js";

class LoadFolderHierarchyUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: FoldersLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute(id: string) {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(id),
            LoadingActionsEnum.init
        );
    }
}

export const LoadFolderHierarchyUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: LoadFolderHierarchyUseCaseWithLoadingImpl,
    dependencies: [FoldersLoadingRepository]
});
