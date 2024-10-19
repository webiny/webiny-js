import { IGetCanManageContentUseCase } from "./IGetCanManageContentUseCase";
import { GetCanManageContentRepository } from "./GetCanManageContentRepository";
import { GetCanManageContentWithFlpUseCase } from "./GetCanManageContentWithFlpUseCase";
import { GetCanManageContentUseCase } from "./GetCanManageContentUseCase";
import { folderCacheFactory } from "../cache";

export class GetCanManageContent {
    static cache: Map<string, IGetCanManageContentUseCase> = new Map();

    public static instance(type: string, canUseFlp: boolean): IGetCanManageContentUseCase {
        if (!this.cache.has(type)) {
            // Create a new instance if not cached
            const foldersCache = folderCacheFactory.getCache(type);
            const repository = new GetCanManageContentRepository(foldersCache);

            if (canUseFlp) {
                return new GetCanManageContentWithFlpUseCase(repository);
            }

            return new GetCanManageContentUseCase();
        }

        // Return the cached instance
        return this.cache.get(type)!;
    }
}
