import { IGetCanManageStructureUseCase } from "./IGetCanManageStructureUseCase";
import { GetCanManageStructureRepository } from "./GetCanManageStructureRepository";
import { GetCanManageStructureWithFlpUseCase } from "./GetCanManageStructureWithFlpUseCase";
import { GetCanManageStructureUseCase } from "./GetCanManageStructureUseCase";
import { folderCacheFactory } from "../cache";

export class GetCanManageStructure {
    static cache: Map<string, IGetCanManageStructureUseCase> = new Map();

    public static instance(type: string, canUseFlp: boolean): IGetCanManageStructureUseCase {
        const foldersCache = folderCacheFactory.getCache(type);
        const repository = new GetCanManageStructureRepository(foldersCache);

        if (canUseFlp) {
            return new GetCanManageStructureWithFlpUseCase(repository);
        }

        return new GetCanManageStructureUseCase();
    }
}
