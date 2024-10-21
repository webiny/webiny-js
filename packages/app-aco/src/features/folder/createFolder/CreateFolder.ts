import { loadingRepositoryFactory } from "@webiny/app-utils";
import { ICreateFolderUseCase } from "./ICreateFolderUseCase";
import { ICreateFolderGateway } from "./ICreateFolderGateway";
import { CreateFolderRepository } from "./CreateFolderRepository";
import { CreateFolderUseCase } from "./CreateFolderUseCase";
import { CreateFolderUseCaseWithLoading } from "./CreateFolderUseCaseWithLoading";
import { folderCacheFactory } from "../cache";

export class CreateFolder {
    public static instance(type: string, gateway: ICreateFolderGateway): ICreateFolderUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const loadingRepository = loadingRepositoryFactory.getRepository(type);
        const repository = new CreateFolderRepository(foldersCache, gateway, type);
        const useCase = new CreateFolderUseCase(repository);
        return new CreateFolderUseCaseWithLoading(loadingRepository, useCase);
    }
}
