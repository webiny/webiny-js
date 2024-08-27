import { ILoadingRepository } from "@webiny/app-utils";
import { Folder } from "~/folders/domain";
import { IUpdateFolderRepository } from "~/folders/repositories";
import { LoadingActionsEnum } from "~/types";

export class UpdateFolderRepositoryWithLoading implements IUpdateFolderRepository {
    private loadingRepository: ILoadingRepository;
    private updateFolderRepository: IUpdateFolderRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        updateFolderRepository: IUpdateFolderRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.updateFolderRepository = updateFolderRepository;
    }

    async execute(folder: Folder) {
        await this.loadingRepository.runCallBack(
            this.updateFolderRepository.execute(folder),
            LoadingActionsEnum.update
        );
    }
}
