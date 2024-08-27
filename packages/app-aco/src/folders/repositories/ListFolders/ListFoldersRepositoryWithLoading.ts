import { ILoadingRepository } from "@webiny/app-utils";
import { IListFoldersRepository } from "~/folders/repositories";
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
    }

    async execute(type: string) {
        await this.loadingRepository.runCallBack(
            this.listFoldersRepository.execute(type),
            LoadingActionsEnum.list
        );
    }
}
