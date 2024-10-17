import { FoldersCache } from "../cache";
import { IGetCanManageContentRepository } from "./IGetCanManageContentRepository";

export class GetCanManageContentRepository implements IGetCanManageContentRepository {
    private cache: FoldersCache;

    constructor(cache: FoldersCache) {
        this.cache = cache;
    }

    execute(id: string) {
        const folder = this.cache.getItem(id);

        if (!folder) {
            return false;
        }

        return folder.canManageContent ?? false;
    }
}
