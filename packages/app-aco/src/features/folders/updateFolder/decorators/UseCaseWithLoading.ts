import { FoldersLoadingRepository } from "../../abstractions.js";
import { UpdateFolderUseCase as UseCaseAbstraction } from "../abstractions.js";
import { LoadingActionsEnum } from "~/types.js";

class UpdateFolderUseCaseWithLoadingImpl implements UseCaseAbstraction.Interface {
    constructor(
        private loadingRepository: FoldersLoadingRepository.Interface,
        private decoratee: UseCaseAbstraction.Interface
    ) {}

    async execute(folder: UseCaseAbstraction.Params) {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(folder),
            LoadingActionsEnum.update
        );
    }
}

export const UpdateFolderUseCaseWithLoading = UseCaseAbstraction.createDecorator({
    decorator: UpdateFolderUseCaseWithLoadingImpl,
    dependencies: [FoldersLoadingRepository]
});
