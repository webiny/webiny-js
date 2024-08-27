import { ILoadingRepository } from "@webiny/app-utils";
import { IGetFolderRepository } from "./IGetFolderRepository";
import { LoadingActionsEnum } from "~/types";

export class GetFolderRepositoryWithLoading implements IGetFolderRepository {
    private loadingRepository: ILoadingRepository;
    private getFolderRepository: IGetFolderRepository;

    constructor(loadingRepository: ILoadingRepository, getFolderRepository: IGetFolderRepository) {
        this.loadingRepository = loadingRepository;
        this.getFolderRepository = getFolderRepository;
    }

    async execute(id: string) {
        await this.loadingRepository.runCallBack(
            this.getFolderRepository.execute(id),
            LoadingActionsEnum.get
        );
    }
}
