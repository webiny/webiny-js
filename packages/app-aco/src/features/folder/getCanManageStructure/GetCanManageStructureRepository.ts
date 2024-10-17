import { FoldersCache } from "../cache";
import { IGetCanManageStructureRepository } from "./IGetCanManageStructureRepository";

export class GetCanManageStructureRepository implements IGetCanManageStructureRepository {
    private cache: FoldersCache;

    constructor(cache: FoldersCache) {
        this.cache = cache;
    }

    execute(id: string) {
        const folder = this.cache.getItem(id);

        if (!folder) {
            return false;
        }

        return folder.canManageStructure ?? false;
    }
}
