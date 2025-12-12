import { FoldersLoadingRepository } from "~/features/folders/abstractions.js";
import { ListFoldersUseCase as UseCaseAbstraction } from "./abstractions.js";
import { LoadingActionsEnum } from "~/types.js";

class ListFoldersUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: FoldersLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute() {
        await this.loadingRepository.runCallBack(this.decoratee.execute(), LoadingActionsEnum.list);
    }
}

export const ListFoldersUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: ListFoldersUseCaseWithLoadingImpl,
    dependencies: [FoldersLoadingRepository]
});
