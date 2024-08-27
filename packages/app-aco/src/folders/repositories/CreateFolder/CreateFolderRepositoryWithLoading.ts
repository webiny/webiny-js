import { ILoadingRepository } from "@webiny/app-utils";
import { Folder } from "~/folders/domain";
import { ICreateFolderRepository } from "~/folders/repositories";
import { LoadingActionsEnum } from "~/types";

export class CreateFolderRepositoryWithLoading implements ICreateFolderRepository {
    private loadingRepository: ILoadingRepository;
    private createFolderRepository: ICreateFolderRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        createFolderRepository: ICreateFolderRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.createFolderRepository = createFolderRepository;
    }

    async execute(folder: Folder) {
        await this.loadingRepository.runCallBack(
            this.createFolderRepository.execute(folder),
            LoadingActionsEnum.create
        );
    }
}
