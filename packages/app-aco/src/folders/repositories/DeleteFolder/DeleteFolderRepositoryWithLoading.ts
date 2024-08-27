import { ILoadingRepository } from "@webiny/app-utils";
import { IDeleteFolderRepository } from "./IDeleteFolderRepository";
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
    }

    async execute(id: string) {
        await this.loadingRepository.runCallBack(
            this.deleteFolderRepository.execute(id),
            LoadingActionsEnum.delete
        );
    }
}
