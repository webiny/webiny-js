import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utils";
import { ICreateFolderRepository } from "~/Domain/Repositories";
import { FolderItem, LoadingActionsEnum } from "~/types";

export class CreateFolderRepositoryWithLoading implements ICreateFolderRepository {
    private loadingRepository: ILoadingRepository;
    private createFolderRepository: ICreateFolderRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        createFolderRepository: ICreateFolderRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.createFolderRepository = createFolderRepository;
        makeAutoObservable(this);
    }

    async execute(folder: FolderItem) {
        await this.loadingRepository.runCallBack(
            this.createFolderRepository.execute(folder),
            LoadingActionsEnum.create
        );
    }
}
