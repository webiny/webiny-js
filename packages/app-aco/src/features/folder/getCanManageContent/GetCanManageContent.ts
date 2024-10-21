import { IGetCanManageContentUseCase } from "./IGetCanManageContentUseCase";
import { GetCanManageContentRepository } from "./GetCanManageContentRepository";
import { GetCanManageContentWithFlpUseCase } from "./GetCanManageContentWithFlpUseCase";
import { GetCanManageContentUseCase } from "./GetCanManageContentUseCase";
import { folderCacheFactory } from "../cache";

export class GetCanManageContent {
    public static instance(type: string, canUseFlp: boolean): IGetCanManageContentUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const repository = new GetCanManageContentRepository(foldersCache);

        if (canUseFlp) {
            return new GetCanManageContentWithFlpUseCase(repository);
        }

        return new GetCanManageContentUseCase();
    }
}
