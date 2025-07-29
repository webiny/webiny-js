import { folderCacheFactory } from "../cache";
import { GetFolderAncestorsRepository } from "./GetFolderAncestorsRepository";
import { GetFolderAncestorsUseCase } from "./GetFolderAncestorsUseCase";
import type { IGetFolderAncestorsUseCase } from "./IGetFolderAncestorsUseCase";

export class GetFolderAncestors {
    public static getInstance(type: string): IGetFolderAncestorsUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const repository = new GetFolderAncestorsRepository(foldersCache);
        return new GetFolderAncestorsUseCase(repository);
    }
}
