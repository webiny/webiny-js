import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utils";
import { IUpdateFolderRepository } from "~/Domain/Repositories";
import { LoadingActionsEnum } from "~/types";
import { FolderItem } from "~/types";

export class UpdateFolderRepositoryWithLoading implements IUpdateFolderRepository {
    private loadingRepository: ILoadingRepository;
    private updateFolderRepository: IUpdateFolderRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        updateFolderRepository: IUpdateFolderRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.updateFolderRepository = updateFolderRepository;
        makeAutoObservable(this);
    }

    async execute(folder: FolderItem) {
        await this.loadingRepository.runCallBack(
            this.updateFolderRepository.execute(folder),
            LoadingActionsEnum.update
        );
    }
}
