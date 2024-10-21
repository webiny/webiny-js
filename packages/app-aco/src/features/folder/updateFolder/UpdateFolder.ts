import { loadingRepositoryFactory } from "@webiny/app-utils";
import { IUpdateFolderUseCase } from "./IUpdateFolderUseCase";
import { IUpdateFolderGateway } from "./IUpdateFolderGateway";
import { UpdateFolderRepository } from "./UpdateFolderRepository";
import { UpdateFolderUseCase } from "./UpdateFolderUseCase";
import { UpdateFolderUseCaseWithLoading } from "./UpdateFolderUseCaseWithLoading";
import { folderCacheFactory } from "~/features/folder";

export class UpdateFolder {
    public static instance(type: string, gateway: IUpdateFolderGateway): IUpdateFolderUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const loadingRepository = loadingRepositoryFactory.getRepository(type);
        const repository = new UpdateFolderRepository(foldersCache, gateway);
        const useCase = new UpdateFolderUseCase(repository);
        return new UpdateFolderUseCaseWithLoading(loadingRepository, useCase);
    }
}
