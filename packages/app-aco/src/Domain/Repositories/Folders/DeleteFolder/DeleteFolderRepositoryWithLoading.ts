import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utils";
import { IDeleteFolderRepository } from "~/Domain/Repositories";
import { FolderDTO } from "~/Domain/Models";
import { LoadingActionsEnum } from "~/types";

export class DeleteFolderRepositoryWithLoading implements IDeleteFolderRepository {
    private loadingRepository: ILoadingRepository;
    private deleteFolderRepository: IDeleteFolderRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        deleteFolderRepository: IDeleteFolderRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.deleteFolderRepository = deleteFolderRepository;
        makeAutoObservable(this);
    }

    async execute(folder: FolderDTO) {
        await this.loadingRepository.runCallBack(
            this.deleteFolderRepository.execute(folder),
            LoadingActionsEnum.delete
        );
    }
}
