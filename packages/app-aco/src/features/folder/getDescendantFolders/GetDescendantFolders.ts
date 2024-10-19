import { IGetDescendantFoldersUseCase } from "./IGetDescendantFoldersUseCase";
import { GetDescendantFoldersRepository } from "./GetDescendantFoldersRepository";
import { GetDescendantFoldersUseCase } from "./GetDescendantFoldersUseCase";
import { folderCacheFactory } from "../cache";

export class GetDescendantFolders {
    static cache: Map<string, IGetDescendantFoldersUseCase> = new Map();

    public static instance(type: string): IGetDescendantFoldersUseCase {
        if (!this.cache.has(type)) {
            // Create a new instance if not cached
            const foldersCache = folderCacheFactory.getCache(type);
            const repository = new GetDescendantFoldersRepository(foldersCache);
            return new GetDescendantFoldersUseCase(repository);
        }

        // Return the cached instance
        return this.cache.get(type)!;
    }
}
