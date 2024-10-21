import { loadingRepositoryFactory } from "@webiny/app-utils";
import { IDeleteFolderUseCase } from "./IDeleteFolderUseCase";
import { DeleteFolderRepository } from "./DeleteFolderRepository";
import { DeleteFolderUseCase } from "./DeleteFolderUseCase";
import { DeleteFolderUseCaseWithLoading } from "./DeleteFolderUseCaseWithLoading";
import { IDeleteFolderGateway } from "./IDeleteFolderGateway";
import { folderCacheFactory } from "../cache";

export class DeleteFolder {
    public static instance(type: string, gateway: IDeleteFolderGateway): IDeleteFolderUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const loadingRepository = loadingRepositoryFactory.getRepository(type);
        const repository = new DeleteFolderRepository(foldersCache, gateway);
        const useCase = new DeleteFolderUseCase(repository);
        return new DeleteFolderUseCaseWithLoading(loadingRepository, useCase);
    }
}
