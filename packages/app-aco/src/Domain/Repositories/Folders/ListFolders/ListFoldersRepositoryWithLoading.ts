import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utils";
import { IListFoldersRepository } from "~/Domain/Repositories";
import { LoadingActionsEnum } from "~/types";

export class ListFoldersRepositoryWithLoading implements IListFoldersRepository {
    private loadingRepository: ILoadingRepository;
    private listFoldersRepository: IListFoldersRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        listFoldersRepository: IListFoldersRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.listFoldersRepository = listFoldersRepository;
        makeAutoObservable(this);
    }

    async execute() {
        await this.loadingRepository.runCallBack(
            this.listFoldersRepository.execute(),
            LoadingActionsEnum.list
        );
    }
}
