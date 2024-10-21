import { IGetDescendantFoldersUseCase } from "./IGetDescendantFoldersUseCase";
import { GetDescendantFoldersRepository } from "./GetDescendantFoldersRepository";
import { GetDescendantFoldersUseCase } from "./GetDescendantFoldersUseCase";
import { folderCacheFactory } from "../cache";

export class GetDescendantFolders {
    public static instance(type: string): IGetDescendantFoldersUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const repository = new GetDescendantFoldersRepository(foldersCache);
        return new GetDescendantFoldersUseCase(repository);
    }
}
